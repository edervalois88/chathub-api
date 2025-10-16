import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/message.schema';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Contact, ContactSchema } from './schemas/contact.schema';
import { ChatController } from './chat.controller';


@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService]
})
export class ChatModule {}
