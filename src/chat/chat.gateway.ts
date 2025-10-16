import { SubscribeMessage, WebSocketGateway, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');

  constructor(private readonly authService: AuthService) {}

  afterInit(server: Server) {
    this.logger.log('Chat Gateway Initialized!');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      const token = client.handshake.headers.authorization.split(' ')[1];
      if (!token) {
        throw new Error('Authentication token not found');
      }
      const user = await this.authService.getUserFromAuthenticationToken(token);
      client['user'] = user;
      this.logger.log(`Client connected: ${client.id} - User: ${user.username}`);
    } catch (error) {
      this.logger.error(`Authentication failed for client: ${client.id}`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client['user']) {
      this.logger.log(`Client disconnected: ${client.id} - User: ${client['user'].username}`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('sendMessage')
  handleMessage(client: Socket, payload: string): void {
    const user = client['user'];
    if (user) {
      this.server.emit('receiveMessage', {
        content: payload,
        author: user.displayName,
        timestamp: new Date(),
      });
    } else {
      // Handle messages from unauthenticated users if desired, or just ignore
    }
  }
}
