import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    id: string | Types.ObjectId | { toString: () => string },
  ): Types.ObjectId {
    if (id instanceof Types.ObjectId) {
      return id;
    }
    if (typeof id === 'string') {
      return new Types.ObjectId(id);
    }
    return new Types.ObjectId(id.toString());
  }

  private tryToObjectId(
    value:
      | string
      | Types.ObjectId
      | { toString: () => string }
      | undefined,
  ): Types.ObjectId | null {
    if (!value) {
      return null;
    }
    try {
      return this.toObjectId(value);
    } catch {
      return null;
    }
  }

  private resolveOrganizationId(
    organization: unknown,
  ): string | null {
    if (!organization) {
      return null;
    }
    if (typeof organization === 'string') {
      return organization;
    }
    if (organization instanceof Types.ObjectId) {
      return organization.toString();
    }
    if (typeof (organization as any)._id === 'string') {
      return (organization as any)._id;
    }
    if ((organization as any)._id instanceof Types.ObjectId) {
      return ((organization as any)._id as Types.ObjectId).toString();
    }
    if (typeof (organization as any).toString === 'function') {
      return (organization as any).toString();
    }
    return null;
  }

  private async assertConversationAccess(
    conversationId: string,
    organizationId: string,
  ): Promise<ConversationDocument> {
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversacion no encontrada');
    }

    const requestedOrg = this.toObjectId(organizationId);
    const storedOrg = conversation.organization
      ? this.toObjectId(conversation.organization as any)
      : null;

    if (!storedOrg || storedOrg.toString() !== requestedOrg.toString()) {
      conversation.organization = requestedOrg as any;
      await conversation.save();
    }

    return conversation;
  }

  async createConversation(
    channel: ChannelType,
    contactId: string,
    organizationId: string,
    createdBy?: string,
  ) {
    const contact = await this.contactModel.findById(contactId);
    const organizationObjectId = this.toObjectId(organizationId);

    if (!contact) {
      throw new NotFoundException('Contacto no encontrado');
    }

    const contactOrganization = contact.organization
      ? this.toObjectId(contact.organization as any)
      : null;

    if (!contactOrganization) {
      contact.organization = organizationObjectId as any;
      await contact.save();
    } else if (
      contactOrganization.toString() !== organizationObjectId.toString()
    ) {
      throw new NotFoundException(
        'No se encontro el contacto dentro de tu organizacion',
      );
    }

    const createdById = createdBy ? this.toObjectId(createdBy) : undefined;

    const conversation = await this.conversationModel.create({
      channel,
      contact: contact._id,
      organization: organizationObjectId,
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
    await this.assertConversationAccess(id, organizationId);
    const conversation = await this.conversationModel
      .findById(id)
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
    organizationId?: string,
  ) {
    const derivedOrganizationId =
      organizationId ?? this.resolveOrganizationId(sender?.organization);

    if (!derivedOrganizationId) {
      throw new ForbiddenException(
        'No se pudo determinar la organizacion del mensaje',
      );
    }

    const conversation = await this.assertConversationAccess(
      conversationId,
      derivedOrganizationId,
    );

    const senderObjectId =
      sender && sender._id ? this.toObjectId(sender._id) : undefined;

    const newMessage = await this.messageModel.create({
      content,
      sender: senderObjectId,
      conversation: conversation._id,
      direction,
    });

    const updateOperations: Record<string, unknown> = {
      $push: { messages: newMessage._id },
      $set: {
        lastMessagePreview: content.slice(0, 140),
        lastActivityAt: new Date(),
      },
    };

    if (senderObjectId) {
      updateOperations['$addToSet'] = { participants: senderObjectId };
    }

    await this.conversationModel
      .updateOne({ _id: conversation._id }, updateOperations)
      .exec();

    return newMessage.populate('sender');
  }

  async getMessagesForConversation(
    conversationId: string,
    organizationId: string,
  ): Promise<MessageDocument[]> {
    await this.assertConversationAccess(conversationId, organizationId);

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

