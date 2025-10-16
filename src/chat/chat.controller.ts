import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@Req() req) {
    const organizationId =
      req.user.organization?._id ?? req.user.organization?.toString();
    return this.chatService.getConversations(organizationId);
  }

  @Post('conversations')
  async createConversation(
    @Req() req,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    const organizationId =
      req.user.organization?._id ?? req.user.organization?.toString();
    return this.chatService.createConversation(
      createConversationDto.channel,
      createConversationDto.contactId,
      organizationId,
      req.user._id,
    );
  }

  @Get('conversations/:id')
  async getConversationById(@Req() req, @Param('id') id: string) {
    const organizationId =
      req.user.organization?._id ?? req.user.organization?.toString();
    return this.chatService.getConversationById(id, organizationId);
  }

  @Get('conversations/:id/messages')
  async getMessagesForConversation(
    @Req() req,
    @Param('id') conversationId: string,
  ) {
    const organizationId =
      req.user.organization?._id ?? req.user.organization?.toString();
    return this.chatService.getMessagesForConversation(
      conversationId,
      organizationId,
    );
  }

  @Post('conversations/:id/messages')
  async createMessage(
    @Param('id') conversationId: string,
    @Body() body: { content: string },
    @Req() req,
  ) {
    const organizationId =
      req.user.organization?._id ?? req.user.organization?.toString();

    // Assuming outbound messages are sent by authenticated users (agents)
    return this.chatService.createMessage(
      body.content,
      req.user,
      conversationId,
      'outbound',
      organizationId,
    );
  }

  @Get('contacts')
  async getContacts(@Req() req) {
    const organizationId =
      req.user.organization?._id ?? req.user.organization?.toString();
    return this.chatService.getContacts(organizationId);
  }

  // You might also want an endpoint to create contacts
  @Post('contacts')
  async createContact(
    @Req() req,
    @Body() body: { name: string; phone?: string; email?: string },
  ) {
    const organizationId =
      req.user.organization?._id ?? req.user.organization?.toString();
    return this.chatService.createContact(
      body.name,
      organizationId,
      req.user._id,
      body.phone,
      body.email,
    );
  }
}
