import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Schema as MongooseSchema } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import {
  Conversation,
  ConversationDocument,
  ChannelType,
} from './schemas/conversation.schema';
import { Contact, ContactDocument } from './schemas/contact.schema';
import { UserDocument } from '../auth/schemas/user.schema';

type AuthenticatedUser =
  | (Partial<UserDocument> & { _id: string; organization: any })
  | null;

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
  ) {}

  private toObjectId(
    id: string | Types.ObjectId | MongooseSchema.Types.ObjectId,
  ): Types.ObjectId {
    if (id instanceof Types.ObjectId) {
      return id;
    }
    if (typeof id === 'string') {
      return new Types.ObjectId(id);
    }
    return new Types.ObjectId(id.toString());
  }

  async createConversation(
    channel: ChannelType,
    contactId: string,
    organizationId: string,
    createdBy?: string,
  ) {
    const contact = await this.contactModel.findOne({
      _id: contactId,
      organization: organizationId,
    });

    if (!contact) {
      throw new NotFoundException(
        'No se encontro el contacto dentro de tu organización',
      );
    }

    const createdById = createdBy ? this.toObjectId(createdBy) : undefined;

    const conversation = await this.conversationModel.create({
      channel,
      contact: contact._id,
      organization: this.toObjectId(organizationId),
      createdBy: createdById,
      participants: createdById ? [createdById] : [],
      messages: [],
      lastMessagePreview: 'Conversacion creada',
      lastActivityAt: new Date(),
    });

    return conversation.populate('contact');
  }

  async getConversations(organizationId: string) {
    return this.conversationModel
      .find({ organization: organizationId })
      .populate('contact')
      .sort({ lastActivityAt: -1 })
      .lean();
  }

  async getConversationById(id: string, organizationId: string) {
    const conversation = await this.conversationModel
      .findOne({ _id: id, organization: organizationId })
      .populate('contact')
      .populate({ path: 'messages', populate: { path: 'sender' } });

    if (!conversation) {
      throw new NotFoundException('Conversacion no encontrada');
    }

    return conversation;
  }

  async createMessage(
    content: string,
    sender: AuthenticatedUser,
    conversationId: string,
    direction: 'inbound' | 'outbound',
  ) {
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversacion no encontrada');
    }

    if (
      sender &&
      conversation.organization.toString() !==
        sender.organization?._id?.toString() &&
      conversation.organization.toString() !== sender.organization?.toString()
    ) {
      throw new ForbiddenException(
        'No tienes acceso a esta conversacion en otra organizacion',
      );
    }

    const senderId =
      sender && sender._id ? this.toObjectId(sender._id) : undefined;

    const newMessage = await this.messageModel.create({
      content,
      sender: senderId,
      conversation: conversation._id,
      direction,
    });

    if (senderId) {
      const senderObjectId = this.toObjectId(senderId);
      if (!Array.isArray(conversation.participants)) {
        conversation.participants = [] as unknown as Types.ObjectId[];
      }
      const senderIdString = senderObjectId.toString();
      const alreadyParticipant = (conversation.participants as Array<
        Types.ObjectId | MongooseSchema.Types.ObjectId | string
      >).some(
        (participant) =>
          this.toObjectId(participant as Types.ObjectId).toString() ===
          senderIdString,
      );
      if (!alreadyParticipant) {
        (conversation.participants as Types.ObjectId[]).push(senderObjectId);
      }
    }

    if (!Array.isArray(conversation.messages)) {
      conversation.messages = [] as unknown as Types.ObjectId[];
    }
    (conversation.messages as Types.ObjectId[]).push(
      this.toObjectId(newMessage._id as Types.ObjectId),
    );
    conversation.lastMessagePreview = content.slice(0, 140);
    conversation.lastActivityAt = new Date();

    await conversation.save();

    return newMessage.populate('sender');
  }

  async getMessagesForConversation(
    conversationId: string,
    organizationId: string,
  ): Promise<MessageDocument[]> {
    const conversation = await this.conversationModel
      .findOne({ _id: conversationId, organization: organizationId })
      .select('_id');

    if (!conversation) {
      throw new NotFoundException('Conversacion no encontrada');
    }

    return this.messageModel
      .find({ conversation: conversationId })
      .populate('sender')
      .sort({ createdAt: 1 })
      .exec();
  }

  async createContact(
    name: string,
    organizationId: string,
    createdBy: string,
    phone?: string,
    email?: string,
  ) {
    const contact = await this.contactModel.create({
      name,
      phone,
      email,
      organization: this.toObjectId(organizationId),
      createdBy: this.toObjectId(createdBy),
    });

    return contact;
  }

  async getContacts(organizationId: string) {
    return this.contactModel
      .find({ organization: organizationId })
      .sort({ name: 1 })
      .lean();
  }
}
