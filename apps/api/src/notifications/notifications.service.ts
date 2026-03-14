import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import type { NotificationFeed, NotificationItem } from '@vendorapp/shared';
import { MessagesGateway } from '../messages/messages.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';

type DbClient = PrismaService | Prisma.TransactionClient;

const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  body: true,
  isRead: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

type NotificationRecord = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect;
}>;

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  async listForUser(userId: string, query: ListNotificationsQueryDto): Promise<NotificationFeed> {
    const limit = query.limit;
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(query.cursor
        ? {
            cursor: {
              id: query.cursor,
            },
            skip: 1,
          }
        : {}),
      select: notificationSelect,
    });

    const hasMore = notifications.length > limit;
    const page = hasMore ? notifications.slice(0, limit) : notifications;
    const unreadCount = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      notifications: page.map((notification) => this.toNotificationItem(notification)),
      unreadCount,
      hasMore,
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async markRead(userId: string, notificationId: string): Promise<NotificationItem> {
    const existing = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      select: notificationSelect,
    });
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    if (existing.isRead) {
      return this.toNotificationItem(existing);
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      select: notificationSelect,
    });

    return this.toNotificationItem(updated);
  }

  async markAllRead(userId: string): Promise<{ success: true }> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  }

  async createMany(db: DbClient, inputs: CreateNotificationInput[]): Promise<NotificationRecord[]> {
    const notifications: NotificationRecord[] = [];
    for (const input of inputs) {
      const notification = await db.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          metadata: input.metadata ?? Prisma.DbNull,
        },
        select: notificationSelect,
      });
      notifications.push(notification);
    }
    return notifications;
  }

  emitMany(notifications: NotificationRecord[]): void {
    for (const notification of notifications) {
      this.messagesGateway.emitNotification(
        notification.userId,
        this.toNotificationItem(notification),
      );
    }
  }

  private toNotificationItem(notification: NotificationRecord): NotificationItem {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      isRead: notification.isRead,
      metadata: this.normalizeMetadata(notification.metadata),
      createdAt: notification.createdAt.toISOString(),
    };
  }

  private normalizeMetadata(value: Prisma.JsonValue | null): Record<string, unknown> | null {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return null;
    }
    return value as Record<string, unknown>;
  }
}
