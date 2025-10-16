import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Conversation, ConversationDocument, ChannelType } from './schemas/conversation.schema';
import { Contact, ContactDocument } from './schemas/contact.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
  ) {}

  async createConversation(channel: ChannelType, contactId: string): Promise<ConversationDocument> {
    const newConversation = new this.conversationModel({
      channel,
      contact: contactId,
      messages: [],
    });
    return newConversation.save();
  }

  async getConversations(): Promise<ConversationDocument[]> {
    return this.conversationModel.find().populate('contact').exec();
  }

  async getConversationById(id: string): Promise<ConversationDocument | null> {
    return this.conversationModel.findById(id).populate('contact').populate('messages').exec();
  }

  async createMessage(
    content: string,
    sender: UserDocument | null, // Sender can be null for inbound messages from contacts
    conversationId: string,
    direction: 'inbound' | 'outbound',
  ): Promise<MessageDocument> {
    const newMessage = new this.messageModel({ 
      content, 
      sender: sender ? sender._id : null,
      conversation: conversationId, 
      direction 
    });
    const savedMessage = await newMessage.save();

    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $push: { messages: savedMessage._id },
    });

    return savedMessage.populate('sender');
  }

  async getMessagesForConversation(conversationId: string): Promise<MessageDocument[]> {
    return this.messageModel
      .find({ conversation: conversationId })
      .populate('sender')
      .sort({ createdAt: 1 })
      .exec();
  }

  // You might also need methods to create/manage contacts
  async createContact(name: string, phone?: string, email?: string): Promise<ContactDocument> {
    const newContact = new this.contactModel({ name, phone, email });
    return newContact.save();
  }

  async getContacts(): Promise<ContactDocument[]> {
    return this.contactModel.find().exec();
  }
}