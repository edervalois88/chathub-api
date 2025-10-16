import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations() {
    return this.chatService.getConversations();
  }

  @Post('conversations')
  async createConversation(@Body() createConversationDto: CreateConversationDto) {
    return this.chatService.createConversation(createConversationDto.channel, createConversationDto.contactId);
  }

  @Get('conversations/:id')
  async getConversationById(@Param('id') id: string) {
    return this.chatService.getConversationById(id);
  }

  @Get('conversations/:id/messages')
  async getMessagesForConversation(@Param('id') conversationId: string) {
    return this.chatService.getMessagesForConversation(conversationId);
  }

  @Post('conversations/:id/messages')
  async createMessage(
    @Param('id') conversationId: string,
    @Body() body: { content: string },
    @Req() req,
  ) {
    // Assuming outbound messages are sent by authenticated users (agents)
    return this.chatService.createMessage(body.content, req.user, conversationId, 'outbound');
  }

  @Get('contacts')
  async getContacts() {
    return this.chatService.getContacts();
  }

  // You might also want an endpoint to create contacts
  @Post('contacts')
  async createContact(@Body() body: { name: string, phone?: string, email?: string }) {
    return this.chatService.createContact(body.name, body.phone, body.email);
  }
}