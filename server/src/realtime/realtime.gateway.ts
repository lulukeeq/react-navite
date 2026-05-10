import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly log = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly auth: AuthService) {}

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      client.emit('error', { message: 'unauthorized' });
      client.disconnect(true);
      return;
    }
    try {
      const payload = await this.auth.verifyAccessToken(token);
      client.data.userId = payload.sub;
      await client.join(this.roomFor(payload.sub));
      client.emit('hello', { userId: payload.sub });
      this.log.debug(`socket ${client.id} joined ${this.roomFor(payload.sub)}`);
    } catch {
      client.emit('error', { message: 'invalid token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.log.debug(`socket ${client.id} disconnected`);
  }

  emitChangedTo(userId: string, since: string) {
    this.server.to(this.roomFor(userId)).emit('changed', { since });
  }

  private roomFor(userId: string) {
    return `user:${userId}`;
  }

  private extractToken(client: Socket): string | undefined {
    const auth = (client.handshake.auth as { token?: string } | undefined)?.token;
    if (auth) return auth;
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length);
    }
    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') return queryToken;
    return undefined;
  }
}
