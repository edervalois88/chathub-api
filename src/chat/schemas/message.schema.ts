import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Conversation } from './conversation.schema';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' }) // Agent sender
  sender: User;

  @Prop({ required: true })
  content: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Conversation', required: true })
  conversation: Conversation;

  @Prop({ type: String, enum: ['inbound', 'outbound'], required: true })
  direction: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
