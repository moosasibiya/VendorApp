import { Injectable, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { ConversationMessage, NotificationItem } from '@vendorapp/shared';
import type { Server, Socket } from 'socket.io';
import { AuthTokenService } from '../auth/auth-token.service';
import { UsersStore } from '../auth/users.store';
import { PrismaService } from '../prisma/prisma.service';

type AuthenticatedSocket = Socket & {
  data: {
    userId?: string;
  };
};

type HandshakeAuthPayload = {
  token?: string;
};

@Injectable()
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server?: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly usersStore: UsersStore,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const userId = await this.authenticateClient(client);
      const authClient = client as AuthenticatedSocket;
      authClient.data.userId = userId;
      authClient.join(this.getUserRoom(userId));

      const conversations = await this.prisma.conversation.findMany({
        where: {
          participantIds: {
            has: userId,
          },
        },
        select: {
          id: true,
        },
      });

      for (const conversation of conversations) {
        authClient.join(this.getConversationRoom(conversation.id));
      }

      this.logger.log(
        JSON.stringify({
          type: 'ws_connected',
          userId,
          socketId: client.id,
          conversationCount: conversations.length,
        }),
      );
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          type: 'ws_connection_rejected',
          socketId: client.id,
          message: error instanceof Error ? error.message : 'Authentication failed',
        }),
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = (client as AuthenticatedSocket).data.userId ?? null;
    this.logger.log(
      JSON.stringify({
        type: 'ws_disconnected',
        socketId: client.id,
        userId,
      }),
    );
  }

  joinConversationForUsers(userIds: string[], conversationId: string): void {
    if (!this.server) {
      return;
    }

    const conversationRoom = this.getConversationRoom(conversationId);
    for (const userId of userIds) {
      this.server.in(this.getUserRoom(userId)).socketsJoin(conversationRoom);
    }
  }

  emitMessage(conversationId: string, message: ConversationMessage): void {
    this.server?.to(this.getConversationRoom(conversationId)).emit('message:new', message);
  }

  emitNotification(userId: string, notification: NotificationItem): void {
    this.server?.to(this.getUserRoom(userId)).emit('notification:new', notification);
  }

  emitConversationUpdated(userIds: string[], conversationId: string): void {
    if (!this.server) {
      return;
    }

    for (const userId of userIds) {
      this.server.to(this.getUserRoom(userId)).emit('conversation:updated', { conversationId });
    }
  }

  private async authenticateClient(client: Socket): Promise<string> {
    const token = this.getTokenFromHandshake(client);
    if (!token) {
      throw new Error('Missing auth token');
    }

    const payload = this.authTokenService.verify(token);
    const user = await this.usersStore.findById(payload.sub);
    if (!user) {
      throw new Error('User not found');
    }

    const tokenVersion =
      Number.isInteger(user.tokenVersion) && user.tokenVersion !== undefined && user.tokenVersion >= 0
        ? user.tokenVersion
        : 0;
    if (tokenVersion !== payload.ver) {
      throw new Error('Token revoked');
    }

    return user.id;
  }

  private getTokenFromHandshake(client: Socket): string | null {
    const authPayload = client.handshake.auth as HandshakeAuthPayload | undefined;
    if (authPayload?.token) {
      return authPayload.token;
    }

    const authorizationHeader = client.handshake.headers.authorization;
    const authorization = Array.isArray(authorizationHeader)
      ? authorizationHeader[0]
      : authorizationHeader;
    if (authorization) {
      const [scheme, token] = authorization.split(' ');
      if (scheme === 'Bearer' && token) {
        return token;
      }
    }

    const cookieHeader = client.handshake.headers.cookie;
    const cookie = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
    if (!cookie) {
      return null;
    }

    const cookieName = process.env.AUTH_COOKIE_NAME?.trim() || 'vendrman_auth';
    for (const chunk of cookie.split(';')) {
      const [rawName, ...rawValueParts] = chunk.trim().split('=');
      if (!rawName || rawValueParts.length === 0 || rawName !== cookieName) {
        continue;
      }
      return decodeURIComponent(rawValueParts.join('='));
    }

    return null;
  }

  private getUserRoom(userId: string): string {
    return `user:${userId}`;
  }

  private getConversationRoom(conversationId: string): string {
    return `conversation:${conversationId}`;
  }
}
