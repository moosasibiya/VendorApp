import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationKind,
  MessageType,
  NotificationType,
  Prisma,
  SupportThreadStatus,
  UserRole,
} from '@prisma/client';
import type {
  ApiResponse,
  ConversationMessage,
  ConversationParticipant,
  ConversationSummary,
  CreateSupportThreadInput,
  CursorApiResponse,
  UpdateSupportThreadInput,
} from '@vendorapp/shared';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformConfigService } from '../platform/platform-config.service';
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
  kind: true,
  subject: true,
  supportCategory: true,
  supportStatus: true,
  supportTicketNumber: true,
  assignedAdminUserId: true,
  resolvedAt: true,
  lastMessageAt: true,
  createdAt: true,
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
  kind: true,
  supportStatus: true,
  assignedAdminUserId: true,
  lastMessageAt: true,
} satisfies Prisma.ConversationSelect;

type MessageRecord = Prisma.MessageGetPayload<{ select: typeof messageSelect }>;
type ConversationSummaryRecord = Prisma.ConversationGetPayload<{ select: typeof conversationSummarySelect }>;
type ConversationAccessRecord = Prisma.ConversationGetPayload<{ select: typeof conversationAccessSelect }>;
type SenderRecord = Prisma.UserGetPayload<{ select: typeof senderSelect }>;

type ViewerContext = {
  userId: string;
  role: UserRole;
};

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly messagesGateway: MessagesGateway,
    private readonly platformConfigService: PlatformConfigService,
  ) {}

  async createConversation(userId: string, input: CreateConversationDto): Promise<ApiResponse<ConversationSummary>> {
    await this.assertMessagingAllowed(userId);

    if (input.bookingId?.trim()) {
      return this.createBookingConversation(userId, input.bookingId.trim());
    }
    if (input.participantId?.trim()) {
      return this.createDirectConversation(userId, input.participantId.trim());
    }
    throw new BadRequestException('bookingId or participantId is required');
  }

  async createSupportConversation(
    userId: string,
    input: CreateSupportThreadInput,
  ): Promise<ApiResponse<ConversationSummary>> {
    const subject = input.subject.trim();
    if (!subject) {
      throw new BadRequestException('Support subject is required');
    }

    if (input.bookingId?.trim()) {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: input.bookingId.trim(),
          OR: [
            { clientId: userId },
            { artist: { userId } },
            { agency: { ownerId: userId } },
          ],
        },
        select: { id: true },
      });
      if (!booking) {
        throw new ForbiddenException('You can only open support on bookings you can access');
      }
    }

    const existing = await this.prisma.conversation.findFirst({
      where: {
        kind: ConversationKind.SUPPORT,
        participantIds: { has: userId },
        supportCategory: input.category as never,
        bookingId: input.bookingId?.trim() || null,
        supportStatus: { in: [SupportThreadStatus.OPEN, SupportThreadStatus.AWAITING_USER, SupportThreadStatus.ESCALATED] },
      },
      select: conversationSummarySelect,
    });
    if (existing) {
      return {
        data: await this.getConversationSummaryForUser(userId, existing.id),
      };
    }

    const supportStatus =
      input.category === 'DISPUTE_HELP' || input.category === 'REFUND_HELP' || input.category === 'OTHER'
        ? SupportThreadStatus.ESCALATED
        : SupportThreadStatus.OPEN;

    const adminIds = await this.getAdminUserIds();
    const conversation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.conversation.create({
        data: {
          bookingId: input.bookingId?.trim() || null,
          participantIds: [userId],
          kind: ConversationKind.SUPPORT,
          subject,
          supportCategory: input.category as never,
          supportStatus,
          supportTicketNumber: await this.platformConfigService.formatSupportTicketNumber(tx),
          lastMessageAt: new Date(),
        },
        select: conversationSummarySelect,
      });

      if (input.initialMessage?.trim()) {
        await tx.message.create({
          data: {
            conversationId: created.id,
            senderId: userId,
            type: MessageType.TEXT,
            content: input.initialMessage.trim(),
            isRead: false,
          },
        });
      }

      const notifications = await this.notificationsService.createMany(
        tx,
        adminIds.map((adminId) => ({
          userId: adminId,
          type: NotificationType.SUPPORT_THREAD_CREATED,
          title: 'New support thread',
          body: `${subject} requires support review.`,
          metadata: {
            conversationId: created.id,
            category: input.category,
            bookingId: input.bookingId?.trim() || null,
          },
        })),
      );
      this.notificationsService.emitMany(notifications);

      return created;
    });

    return {
      data: await this.getConversationSummaryForUser(userId, conversation.id),
    };
  }

  async updateSupportThread(
    userId: string,
    conversationId: string,
    input: UpdateSupportThreadInput,
  ): Promise<ApiResponse<ConversationSummary>> {
    const viewer = await this.getViewerContext(userId);
    if (!this.isAdminRole(viewer.role)) {
      throw new ForbiddenException('Only admins can update support threads');
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        kind: ConversationKind.SUPPORT,
      },
      select: conversationAccessSelect,
    });
    if (!conversation) {
      throw new NotFoundException('Support thread not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          supportStatus: (input.status as never) ?? undefined,
          assignedAdminUserId:
            input.assignedAdminUserId === undefined ? undefined : input.assignedAdminUserId || null,
          resolvedAt: input.status
            ? input.status === 'RESOLVED'
              ? new Date()
              : null
            : undefined,
          participantIds:
            input.assignedAdminUserId && !conversation.participantIds.includes(input.assignedAdminUserId)
              ? [...conversation.participantIds, input.assignedAdminUserId]
              : undefined,
        },
      });

      if (input.internalNote?.trim()) {
        await tx.message.create({
          data: {
            conversationId,
            senderId: userId,
            type: MessageType.SYSTEM,
            content: input.internalNote.trim(),
            isRead: false,
          },
        });
      }
    });

    return {
      data: await this.getConversationSummaryForUser(userId, conversationId),
    };
  }

  async listConversations(userId: string): Promise<ApiResponse<ConversationSummary[]>> {
    const viewer = await this.getViewerContext(userId);
    const conversations = await this.prisma.conversation.findMany({
      where: this.getConversationListWhere(viewer),
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

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: messageSelect,
    });

    const hasMore = messages.length > query.limit;
    const page = hasMore ? messages.slice(0, query.limit) : messages;

    return {
      data: page.reverse().map((message) => this.toConversationMessage(message)),
      meta: {
        limit: query.limit,
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
    const viewer = await this.getViewerContext(userId);
    if (conversation.kind !== ConversationKind.SUPPORT) {
      await this.assertMessagingAllowed(userId);
    }
    const content = input.content.trim();
    if (!content) {
      throw new BadRequestException('Message content is required');
    }

    const supportAdminIds =
      conversation.kind === ConversationKind.SUPPORT && !this.isAdminRole(viewer.role)
        ? await this.getAdminUserIds()
        : [];
    const recipientIds =
      conversation.kind === ConversationKind.SUPPORT && this.isAdminRole(viewer.role)
        ? conversation.participantIds.filter((participantId) => participantId !== userId)
        : conversation.kind === ConversationKind.SUPPORT
          ? Array.from(new Set([...supportAdminIds, ...conversation.participantIds])).filter((id) => id !== userId)
          : conversation.participantIds.filter((participantId) => participantId !== userId);

    let createdMessage!: MessageRecord;
    let createdNotifications: Awaited<ReturnType<NotificationsService['createMany']>> = [];

    await this.prisma.$transaction(async (tx) => {
      const participantIds =
        conversation.kind === ConversationKind.SUPPORT && !conversation.participantIds.includes(userId)
          ? [...conversation.participantIds, userId]
          : conversation.participantIds;

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

      const supportUpdate =
        conversation.kind !== ConversationKind.SUPPORT
          ? {}
          : this.isAdminRole(viewer.role)
            ? {
                supportStatus: SupportThreadStatus.AWAITING_USER,
                assignedAdminUserId: conversation.assignedAdminUserId ?? userId,
                participantIds,
                resolvedAt: null,
              }
            : {
                supportStatus:
                  conversation.supportStatus === SupportThreadStatus.RESOLVED
                    ? SupportThreadStatus.OPEN
                    : SupportThreadStatus.OPEN,
                participantIds,
                resolvedAt: null,
              };

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: createdMessage.createdAt,
          ...supportUpdate,
        },
      });

      createdNotifications = await this.notificationsService.createMany(
        tx,
        recipientIds.map((recipientId) => ({
          userId: recipientId,
          type:
            conversation.kind === ConversationKind.SUPPORT
              ? NotificationType.SUPPORT_THREAD_UPDATED
              : NotificationType.MESSAGE_RECEIVED,
          title: conversation.kind === ConversationKind.SUPPORT ? 'Support thread updated' : 'New message',
          body:
            conversation.kind === ConversationKind.SUPPORT
              ? `${createdMessage.sender.fullName}: ${this.buildMessagePreview(content, input.type as MessageType)}`
              : `${createdMessage.sender.fullName}: ${this.buildMessagePreview(content, input.type as MessageType)}`,
          metadata: {
            conversationId,
            bookingId: conversation.bookingId,
            senderId: userId,
            kind: conversation.kind,
          },
        })),
      );
    });

    const message = this.toConversationMessage(createdMessage);
    this.messagesGateway.emitMessage(conversationId, message);
    this.messagesGateway.emitConversationUpdated([...conversation.participantIds, ...recipientIds], conversationId);
    this.notificationsService.emitMany(createdNotifications);

    return { data: message };
  }

  async markConversationRead(userId: string, conversationId: string): Promise<{ success: true }> {
    const conversation = await this.findAccessibleConversationOrThrow(userId, conversationId);
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    this.messagesGateway.emitConversationUpdated(conversation.participantIds, conversationId);
    return { success: true };
  }

  private async getConversationSummaryForUser(userId: string, conversationId: string): Promise<ConversationSummary> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        id: conversationId,
        ...this.getConversationListWhere(await this.getViewerContext(userId)),
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
    const participantIds = Array.from(new Set(conversations.flatMap((conversation) => conversation.participantIds)));

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
          conversationId: { in: conversationIds },
          senderId: { not: userId },
          isRead: false,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    const participantMap = new Map(participants.map((participant) => [participant.id, this.toConversationParticipant(participant)]));
    const unreadMap = new Map(unreadCounts.map((entry) => [entry.conversationId, entry._count._all]));

    return conversations.map((conversation) => ({
      id: conversation.id,
      bookingId: conversation.bookingId,
      participantIds: conversation.participantIds,
      participants: conversation.participantIds
        .map((participantId) => participantMap.get(participantId))
        .filter((participant): participant is ConversationParticipant => Boolean(participant)),
      kind: conversation.kind,
      subject: conversation.subject,
      supportCategory: conversation.supportCategory,
      supportStatus: conversation.supportStatus,
      supportTicketNumber: conversation.supportTicketNumber,
      assignedAdminUserId: conversation.assignedAdminUserId,
      resolvedAt: conversation.resolvedAt?.toISOString() ?? null,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      unreadCount: unreadMap.get(conversation.id) ?? 0,
      lastMessage: conversation.messages[0] ? this.toConversationMessage(conversation.messages[0]) : null,
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

  private async findAccessibleConversationOrThrow(userId: string, conversationId: string): Promise<ConversationAccessRecord> {
    const viewer = await this.getViewerContext(userId);
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        ...this.getConversationListWhere(viewer),
      },
      select: conversationAccessSelect,
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  private async createBookingConversation(userId: string, bookingId: string): Promise<ApiResponse<ConversationSummary>> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
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

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        bookingId: booking.id,
        kind: ConversationKind.BOOKING,
      },
      select: conversationSummarySelect,
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          bookingId: booking.id,
          participantIds,
          kind: ConversationKind.BOOKING,
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

  private async createDirectConversation(userId: string, participantId: string): Promise<ApiResponse<ConversationSummary>> {
    const targetUserId = await this.resolveDirectConversationParticipantId(participantId);
    if (targetUserId === userId) {
      throw new BadRequestException('You cannot start a conversation with yourself');
    }

    const participantIds = Array.from(new Set([userId, targetUserId]));
    const existingConversations = await this.prisma.conversation.findMany({
      where: {
        bookingId: null,
        kind: ConversationKind.DIRECT,
        participantIds: {
          hasEvery: participantIds,
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      select: conversationSummarySelect,
    });

    let conversation =
      existingConversations.find(
        (item) =>
          item.participantIds.length === participantIds.length &&
          participantIds.every((id) => item.participantIds.includes(id)),
      ) ?? null;

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          bookingId: null,
          participantIds,
          kind: ConversationKind.DIRECT,
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

  private async resolveDirectConversationParticipantId(participantId: string): Promise<string> {
    const directUser = await this.prisma.user.findUnique({
      where: { id: participantId },
      select: { id: true, isActive: true },
    });
    if (directUser?.isActive) {
      return directUser.id;
    }

    const artist = await this.prisma.artist.findUnique({
      where: { id: participantId },
      select: {
        userId: true,
        user: { select: { id: true, isActive: true } },
      },
    });

    if (!artist?.userId || !artist.user?.isActive) {
      throw new NotFoundException('Conversation participant not found');
    }

    return artist.userId;
  }

  private buildParticipantIds(clientId: string, artistUserId: string | null): string[] {
    if (!artistUserId) {
      throw new BadRequestException('Selected booking artist cannot receive messages yet');
    }
    return Array.from(new Set([clientId, artistUserId]));
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

  private buildMessagePreview(content: string, type: MessageType): string {
    if (type === MessageType.IMAGE) return content || 'Sent an image';
    if (type === MessageType.FILE) return content || 'Sent a file';
    return content.length > 120 ? `${content.slice(0, 117)}...` : content;
  }

  private async getViewerContext(userId: string): Promise<ViewerContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { userId: user.id, role: user.role };
  }

  private async assertMessagingAllowed(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        onboardingCompletedAt: true,
        artistProfile: {
          select: {
            id: true,
            onboardingCompleted: true,
          },
        },
        ownedAgency: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (this.isAdminRole(user.role) || user.onboardingCompletedAt) {
      return;
    }

    if (user.role === UserRole.ARTIST && user.artistProfile?.onboardingCompleted) {
      return;
    }

    if (user.role === UserRole.AGENCY && user.ownedAgency?.id) {
      return;
    }

    throw new ForbiddenException(
      'Complete onboarding before starting or replying to non-support conversations.',
    );
  }

  private getConversationListWhere(viewer: ViewerContext): Prisma.ConversationWhereInput {
    if (this.isAdminRole(viewer.role)) {
      return {
        OR: [
          { participantIds: { has: viewer.userId } },
          { kind: ConversationKind.SUPPORT },
        ],
      };
    }

    return {
      participantIds: {
        has: viewer.userId,
      },
    };
  }

  private async getAdminUserIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.ADMIN, UserRole.SUB_ADMIN],
        },
      },
      select: { id: true },
    });
    return admins.map((admin) => admin.id);
  }

  private isAdminRole(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUB_ADMIN;
  }
}
