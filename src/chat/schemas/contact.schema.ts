import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true })
export class Contact {
  @Prop({ required: true })
  name: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  // Assuming a multi-tenant setup where a contact belongs to a company
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company' }) // Assuming you have a Company model
  company: MongooseSchema.Types.ObjectId;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
