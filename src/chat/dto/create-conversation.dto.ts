import { IsString, IsEnum } from 'class-validator';
import { ChannelType } from '../schemas/conversation.schema';

export class CreateConversationDto {
  @IsEnum(ChannelType)
  channel: ChannelType;

  @IsString()
  contactId: string;
}
