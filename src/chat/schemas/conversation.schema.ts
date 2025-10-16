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

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Message' }] })
  messages: MongooseSchema.Types.ObjectId[];

  // You can add more fields here, like assigned agent, status, etc.
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
