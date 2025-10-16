import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Contact } from './contact.schema';

export type ConversationDocument = Conversation & Document;

export enum ChannelType {
  WHATSAPP = 'WhatsApp',
  WEB_CHAT = 'Web Chat',
  SMS = 'SMS',
}

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ required: true, enum: ChannelType })
  channel: ChannelType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Contact', required: true })
  contact: MongooseSchema.Types.ObjectId | Contact;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organization: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  participants: MongooseSchema.Types.ObjectId[];

  @Prop({
    type: String,
    enum: ['open', 'pending', 'resolved'],
    default: 'open',
  })
  status: 'open' | 'pending' | 'resolved';

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Message' }] })
  messages: MongooseSchema.Types.ObjectId[];

  @Prop({ trim: true })
  lastMessagePreview?: string;

  @Prop({ default: Date.now })
  lastActivityAt: Date;

  // You can add more fields here, like assigned agent, status, etc.
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
