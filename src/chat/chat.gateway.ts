import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
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

  private normalizeOrganizationId(source: unknown): string | undefined {
    if (!source) {
      return undefined;
    }
    if (typeof source === 'string') {
      return source;
    }
    if (typeof source === 'object') {
      const candidate: any = source;
      if (typeof candidate._id === 'string') {
        return candidate._id;
      }
      if (candidate._id && typeof candidate._id.toString === 'function') {
        return candidate._id.toString();
      }
      if (typeof candidate.id === 'string') {
        return candidate.id;
      }
      if (typeof candidate.toString === 'function') {
        return candidate.toString();
      }
    }
    return undefined;
  }

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
  async handleJoinConversation(
    client: AuthenticatedSocket,
    conversationId: string,
  ): Promise<void> {
    try {
      const organizationId = this.normalizeOrganizationId(
        client.user?.organization,
      );
      if (!organizationId) {
        throw new Error('Organizacion no detectada en el contexto del usuario');
      }
      const messages = await this.chatService.getMessagesForConversation(
        conversationId,
        organizationId,
      );
      client.conversationId = conversationId;
      const history = {
        event: 'messageHistory',
        data: messages,
      };
      client.send(JSON.stringify(history));
    } catch (error) {
      this.logger.error(
        `Error al unirse a la conversacion: ${(error as Error).message}`,
      );
      client.send(
        JSON.stringify({
          event: 'error',
          data: 'No se pudo acceder a la conversacion solicitada',
        }),
      );
    }
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(client: AuthenticatedSocket): void {
    client.conversationId = undefined;
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: AuthenticatedSocket,
    payload: any,
  ): Promise<void> {
    const user = client.user;
    const conversationId = client.conversationId;

    if (user && conversationId) {
      const organizationId = this.normalizeOrganizationId(user.organization);

      if (!organizationId) {
        this.logger.error(
          'No se encontro la organizacion del usuario para enviar el mensaje',
        );
        return;
      }

      const content =
        typeof payload === 'string'
          ? payload
          : payload?.content ?? payload?.data ?? '';

      if (!content) {
        return;
      }

      const savedMessage = await this.chatService.createMessage(
        content,
        user,
        conversationId,
        'outbound',
        organizationId,
      );

      const message = {
        event: 'receiveMessage',
        data: savedMessage,
      };

      // Broadcast to all clients in the same conversation
      this.server.clients.forEach((c) => {
        const ac = c as AuthenticatedSocket;
        if (ac.readyState === WebSocket.OPEN && ac.conversationId === conversationId) {
          ac.send(JSON.stringify(message));
        }
      });
    }
  }
}
