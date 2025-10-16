import { SubscribeMessage, WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';

type AuthenticatedSocket = WebSocket & {
  user?: any;
  conversationId?: string;
};

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');

  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Chat Gateway Initialized');
  }

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      const req = args[0];
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        throw new Error('Authentication token not found');
      }
      const user = await this.authService.getUserFromAuthenticationToken(token);
      client.user = user;
      this.logger.log(`Client connected: ${user.username}`);

    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      (client as any).terminate();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      this.logger.log(`Client disconnected: ${client.user.username}`);
    } else {
      this.logger.log(`Client disconnected (unauthenticated)`);
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(client: AuthenticatedSocket, conversationId: string): Promise<void> {
    client.conversationId = conversationId;
    const messages = await this.chatService.getMessagesForConversation(conversationId);
    const history = {
      event: 'messageHistory',
      data: messages,
    };
    client.send(JSON.stringify(history));
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(client: AuthenticatedSocket): void {
    client.conversationId = undefined;
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: AuthenticatedSocket, payload: any): Promise<void> {
    const user = client.user;
    const conversationId = client.conversationId;

    if (user && conversationId) {
      const savedMessage = await this.chatService.createMessage(payload.content, user, conversationId, 'outbound');
      
      const message = {
        event: 'receiveMessage',
        data: savedMessage,
      };

      // Broadcast to all clients in the same conversation
      this.server.clients.forEach(c => {
        const ac = c as AuthenticatedSocket;
        if (ac.readyState === WebSocket.OPEN && ac.conversationId === conversationId) {
          ac.send(JSON.stringify(message));
        }
      });
    }
  }
}
