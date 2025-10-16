import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, unique: true, trim: true })
  slug: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  primaryColor?: string;

  @Prop({ trim: true })
  secondaryColor?: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
