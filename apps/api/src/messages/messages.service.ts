import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageType, NotificationType, Prisma } from '@prisma/client';
import type {
  ApiResponse,
  ConversationMessage,
  ConversationParticipant,
  ConversationSummary,
  CursorApiResponse,
} from '@vendorapp/shared';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ListConversationMessagesQueryDto } from './dto/list-conversation-messages-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesGateway } from './messages.gateway';

const senderSelect = {
  id: true,
  fullName: true,
  avatarUrl: true,
  role: true,
} satisfies Prisma.UserSelect;

const messageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  type: true,
  content: true,
  fileUrl: true,
  isRead: true,
  createdAt: true,
  sender: {
    select: senderSelect,
  },
} satisfies Prisma.MessageSelect;

const conversationSummarySelect = {
  id: true,
  bookingId: true,
  participantIds: true,
  lastMessageAt: true,
  booking: {
    select: {
      id: true,
      title: true,
      location: true,
      eventDate: true,
      status: true,
      totalAmount: true,
      artist: {
        select: {
          slug: true,
        },
      },
    },
  },
  messages: {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 1,
    select: messageSelect,
  },
} satisfies Prisma.ConversationSelect;

const conversationAccessSelect = {
  id: true,
  bookingId: true,
  participantIds: true,
  lastMessageAt: true,
} satisfies Prisma.ConversationSelect;

type MessageRecord = Prisma.MessageGetPayload<{
  select: typeof messageSelect;
}>;

type ConversationSummaryRecord = Prisma.ConversationGetPayload<{
  select: typeof conversationSummarySelect;
}>;

type ConversationAccessRecord = Prisma.ConversationGetPayload<{
  select: typeof conversationAccessSelect;
}>;

type SenderRecord = Prisma.UserGetPayload<{
  select: typeof senderSelect;
}>;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  async createConversation(
    userId: string,
    input: CreateConversationDto,
  ): Promise<ApiResponse<ConversationSummary>> {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: input.bookingId,
      },
      select: {
        id: true,
        clientId: true,
        artist: {
          select: {
            userId: true,
          },
        },
      },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const participantIds = this.buildParticipantIds(booking.clientId, booking.artist.userId);
    if (!participantIds.includes(userId)) {
      throw new ForbiddenException('Only booking participants can create a conversation');
    }

    let conversation = await this.prisma.conversation.findUnique({
      where: {
        bookingId: booking.id,
      },
      select: conversationSummarySelect,
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          bookingId: booking.id,
          participantIds,
          lastMessageAt: new Date(),
        },
        select: conversationSummarySelect,
      });
    }

    this.messagesGateway.joinConversationForUsers(participantIds, conversation.id);
    this.messagesGateway.emitConversationUpdated(participantIds, conversation.id);

    return {
      data: await this.getConversationSummaryForUser(userId, conversation.id),
    };
  }

  async listConversations(userId: string): Promise<ApiResponse<ConversationSummary[]>> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participantIds: {
          has: userId,
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
      select: conversationSummarySelect,
    });

    return {
      data: await this.mapConversationSummaries(userId, conversations),
    };
  }

  async listMessages(
    userId: string,
    conversationId: string,
    query: ListConversationMessagesQueryDto,
  ): Promise<CursorApiResponse<ConversationMessage[]>> {
    await this.findAccessibleConversationOrThrow(userId, conversationId);

    const limit = query.limit;
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
      },
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
      select: messageSelect,
    });

    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;

    return {
      data: page.reverse().map((message) => this.toConversationMessage(message)),
      meta: {
        limit,
        hasMore,
        nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
      },
    };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    input: SendMessageDto,
  ): Promise<ApiResponse<ConversationMessage>> {
    const conversation = await this.findAccessibleConversationOrThrow(userId, conversationId);
    const content = input.content.trim();
    if (!content) {
      throw new BadRequestException('Message content is required');
    }

    const recipientIds = conversation.participantIds.filter(
      (participantId) => participantId !== userId,
    );
    const preview = this.buildMessagePreview(content, input.type as MessageType);
    let createdMessage!: MessageRecord;
    let createdNotifications: Awaited<ReturnType<NotificationsService['createMany']>> = [];

    await this.prisma.$transaction(async (tx) => {
      createdMessage = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          type: input.type as unknown as MessageType,
          content,
          fileUrl: input.fileUrl?.trim() || null,
          isRead: false,
        },
        select: messageSelect,
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: createdMessage.createdAt,
        },
      });

      createdNotifications = await this.notificationsService.createMany(
        tx,
        recipientIds.map((recipientId) => ({
          userId: recipientId,
          type: NotificationType.MESSAGE_RECEIVED,
          title: 'New message',
          body: `${createdMessage.sender.fullName}: ${preview}`,
          metadata: {
            conversationId,
            bookingId: conversation.bookingId,
            senderId: userId,
          },
        })),
      );
    });

    const message = this.toConversationMessage(createdMessage);
    this.messagesGateway.emitMessage(conversationId, message);
    this.messagesGateway.emitConversationUpdated(conversation.participantIds, conversationId);
    this.notificationsService.emitMany(createdNotifications);

    return {
      data: message,
    };
  }

  async markConversationRead(
    userId: string,
    conversationId: string,
  ): Promise<{ success: true }> {
    const conversation = await this.findAccessibleConversationOrThrow(userId, conversationId);
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    this.messagesGateway.emitConversationUpdated(conversation.participantIds, conversationId);

    return { success: true };
  }

  private async getConversationSummaryForUser(
    userId: string,
    conversationId: string,
  ): Promise<ConversationSummary> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        id: conversationId,
        participantIds: {
          has: userId,
        },
      },
      select: conversationSummarySelect,
    });
    if (conversations.length === 0) {
      throw new NotFoundException('Conversation not found');
    }

    const [summary] = await this.mapConversationSummaries(userId, conversations);
    return summary;
  }

  private async mapConversationSummaries(
    userId: string,
    conversations: ConversationSummaryRecord[],
  ): Promise<ConversationSummary[]> {
    if (conversations.length === 0) {
      return [];
    }

    const conversationIds = conversations.map((conversation) => conversation.id);
    const participantIds = Array.from(
      new Set(conversations.flatMap((conversation) => conversation.participantIds)),
    );

    const [participants, unreadCounts] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          id: {
            in: participantIds,
          },
        },
        select: senderSelect,
      }),
      this.prisma.message.groupBy({
        by: ['conversationId'],
        where: {
          conversationId: {
            in: conversationIds,
          },
          senderId: {
            not: userId,
          },
          isRead: false,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const participantMap = new Map(
      participants.map((participant) => [
        participant.id,
        this.toConversationParticipant(participant),
      ]),
    );
    const unreadMap = new Map(
      unreadCounts.map((entry) => [entry.conversationId, entry._count._all]),
    );

    return conversations.map((conversation) => ({
      id: conversation.id,
      bookingId: conversation.bookingId,
      participantIds: conversation.participantIds,
      participants: conversation.participantIds
        .map((participantId) => participantMap.get(participantId))
        .filter((participant): participant is ConversationParticipant => Boolean(participant)),
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      unreadCount: unreadMap.get(conversation.id) ?? 0,
      lastMessage: conversation.messages[0]
        ? this.toConversationMessage(conversation.messages[0])
        : null,
      booking: conversation.booking
        ? {
            id: conversation.booking.id,
            title: conversation.booking.title,
            location: conversation.booking.location,
            eventDate: conversation.booking.eventDate.toISOString(),
            status: conversation.booking.status,
            totalAmount: Number(conversation.booking.totalAmount.toString()),
            artistSlug: conversation.booking.artist.slug,
          }
        : null,
    }));
  }

  private async findAccessibleConversationOrThrow(
    userId: string,
    conversationId: string,
  ): Promise<ConversationAccessRecord> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participantIds: {
          has: userId,
        },
      },
      select: conversationAccessSelect,
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  private toConversationMessage(message: MessageRecord): ConversationMessage {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      type: message.type,
      content: message.content,
      fileUrl: message.fileUrl,
      isRead: message.isRead,
      createdAt: message.createdAt.toISOString(),
      sender: this.toConversationParticipant(message.sender),
    };
  }

  private toConversationParticipant(participant: SenderRecord): ConversationParticipant {
    return {
      userId: participant.id,
      name: participant.fullName,
      avatarUrl: participant.avatarUrl,
      role: participant.role,
    };
  }

  private buildParticipantIds(clientId: string, artistUserId: string | null): string[] {
    if (!artistUserId) {
      throw new BadRequestException('Selected booking artist cannot receive messages yet');
    }

    return Array.from(new Set([clientId, artistUserId]));
  }

  private buildMessagePreview(content: string, type: MessageType): string {
    if (type === MessageType.IMAGE) {
      return content || 'Sent an image';
    }
    if (type === MessageType.FILE) {
      return content || 'Sent a file';
    }
    return content.length > 120 ? `${content.slice(0, 117)}...` : content;
  }
}
