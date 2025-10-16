import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, trim: true })
  email: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organization: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    enum: ['owner', 'admin', 'agent'],
    default: 'agent',
  })
  role: 'owner' | 'admin' | 'agent';

  @Prop({ trim: true })
  avatarColor?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
