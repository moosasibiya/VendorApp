import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BookingStatus as PrismaBookingStatus,
  NotificationType,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import type { ApiResponse, Booking, BookingAction } from '@vendorapp/shared';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

const bookingSelect = {
  id: true,
  clientId: true,
  artistId: true,
  agencyId: true,
  title: true,
  description: true,
  eventDate: true,
  eventEndDate: true,
  location: true,
  status: true,
  totalAmount: true,
  platformFee: true,
  artistPayout: true,
  paymentProvider: true,
  paymentStatus: true,
  stripePaymentIntentId: true,
  paymentReference: true,
  paymentGatewayReference: true,
  paymentInitiatedAt: true,
  paymentPaidAt: true,
  paymentFailedAt: true,
  notes: true,
  cancelledAt: true,
  cancelReason: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
    },
  },
  artist: {
    select: {
      id: true,
      userId: true,
      slug: true,
      displayName: true,
      location: true,
      hourlyRate: true,
      isAvailable: true,
      user: {
        select: {
          avatarUrl: true,
        },
      },
    },
  },
  agency: {
    select: {
      id: true,
      ownerId: true,
      name: true,
      slug: true,
      logoUrl: true,
    },
  },
  review: {
    select: {
      id: true,
      rating: true,
      comment: true,
      isPublic: true,
      createdAt: true,
    },
  },
  statusHistory: {
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      action: true,
      reason: true,
      actorUserId: true,
      actorName: true,
      actorRole: true,
      createdAt: true,
    },
  },
} satisfies Prisma.BookingSelect;

type BookingRecord = Prisma.BookingGetPayload<{
  select: typeof bookingSelect;
}>;

type ActorContext = {
  userId: string;
  name: string;
  role: UserRole;
  artistProfileId: string | null;
  agencyId: string | null;
};

type StatusChangePlan = {
  nextStatus: PrismaBookingStatus;
  action: string;
  reason?: string | null;
  notificationType: NotificationType;
  notificationTitle: string;
  notificationBody: string;
};

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(userId: string, query: ListBookingsQueryDto): Promise<ApiResponse<Booking[]>> {
    const actor = await this.getActorContext(userId);
    this.validateDateRange(query);

    const accessWhere = this.buildAccessWhere(actor);
    await this.syncAutomaticStatuses(accessWhere);

    const where = this.buildListWhere(actor, query);
    const page = query.page;
    const limit = query.limit;
    const total = await this.prisma.booking.count({ where });
    const bookings = await this.prisma.booking.findMany({
      where,
      orderBy: [{ eventDate: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: bookingSelect,
    });

    return {
      data: bookings.map((booking) => this.toBookingResponse(booking, actor)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, bookingId: string): Promise<ApiResponse<Booking>> {
    const actor = await this.getActorContext(userId);
    let booking = await this.findAccessibleBookingOrThrow(actor, bookingId);
    const changed = await this.syncAutomaticStatus(booking);
    if (changed) {
      booking = await this.findAccessibleBookingOrThrow(actor, bookingId);
    }

    return {
      data: this.toBookingResponse(booking, actor),
    };
  }

  async create(userId: string, input: CreateBookingDto): Promise<ApiResponse<Booking>> {
    const actor = await this.getActorContext(userId);
    if (actor.role !== UserRole.CLIENT) {
      throw new ForbiddenException('Only client accounts can create bookings');
    }

    const artist = await this.prisma.artist.findUnique({
      where: { id: input.artistId },
      select: {
        id: true,
        userId: true,
        displayName: true,
        hourlyRate: true,
        isAvailable: true,
      },
    });
    if (!artist) {
      throw new NotFoundException('Artist not found');
    }
    if (!artist.isAvailable) {
      throw new BadRequestException('Selected artist is currently unavailable');
    }
    if (artist.userId && artist.userId === actor.userId) {
      throw new BadRequestException('You cannot book your own artist profile');
    }

    const eventDate = this.parseDate(input.eventDate, 'eventDate');
    const eventEndDate = input.eventEndDate
      ? this.parseDate(input.eventEndDate, 'eventEndDate')
      : null;
    if (eventDate.getTime() <= Date.now()) {
      throw new BadRequestException('eventDate must be in the future');
    }
    if (eventEndDate && eventEndDate.getTime() <= eventDate.getTime()) {
      throw new BadRequestException('eventEndDate must be after eventDate');
    }

    const amounts = this.calculateAmounts(artist.hourlyRate, eventDate, eventEndDate);
    const bookingId = `bk-${randomBytes(8).toString('hex')}`;
    const normalizedNotes = this.normalizeOptionalString(input.notes);
    const normalizedReason = `Booking created by ${actor.name}`;

    const transactionResult = await this.prisma.$transaction(async (tx) => {
      await tx.booking.create({
        data: {
          id: bookingId,
          clientId: actor.userId,
          artistId: artist.id,
          title: input.title.trim(),
          description: input.description.trim(),
          eventDate,
          eventEndDate,
          location: input.location.trim(),
          status: PrismaBookingStatus.PENDING,
          totalAmount: amounts.totalAmount,
          platformFee: amounts.platformFee,
          artistPayout: amounts.artistPayout,
          paymentProvider: null,
          paymentStatus: PaymentStatus.UNPAID,
          paymentReference: null,
          paymentGatewayReference: null,
          paymentInitiatedAt: null,
          paymentPaidAt: null,
          paymentFailedAt: null,
          notes: normalizedNotes,
          artistName: artist.displayName,
          artistInitials: this.getInitials(artist.displayName),
          date: eventDate.toISOString(),
          amount: this.formatMoney(amounts.totalAmount),
          applications: 0,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: null,
          toStatus: PrismaBookingStatus.PENDING,
          action: 'create',
          reason: normalizedReason,
          actorUserId: actor.userId,
          actorName: actor.name,
          actorRole: actor.role,
        },
      });

      if (artist.userId) {
        return this.notificationsService.createMany(tx, [
          {
            userId: artist.userId,
            type: NotificationType.BOOKING_REQUEST,
            title: 'New booking request',
            body: `${actor.name} requested "${input.title.trim()}".`,
            metadata: {
              bookingId,
              status: PrismaBookingStatus.PENDING,
            },
          },
        ]);
      }
      return [];
    });

    this.notificationsService.emitMany(transactionResult);

    const booking = await this.findAccessibleBookingOrThrow(actor, bookingId);
    return {
      data: this.toBookingResponse(booking, actor),
    };
  }

  async updateStatus(
    userId: string,
    bookingId: string,
    input: UpdateBookingStatusDto,
  ): Promise<ApiResponse<Booking>> {
    const actor = await this.getActorContext(userId);
    let booking = await this.findAccessibleBookingOrThrow(actor, bookingId);
    const autoChanged = await this.syncAutomaticStatus(booking);
    if (autoChanged) {
      booking = await this.findAccessibleBookingOrThrow(actor, bookingId);
    }

    const plan = this.resolveStatusChange(actor, booking, input);
    await this.applyStatusChange(booking, plan, actor);
    const updated = await this.findAccessibleBookingOrThrow(actor, bookingId);

    return {
      data: this.toBookingResponse(updated, actor),
    };
  }

  private async getActorContext(userId: string): Promise<ActorContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        role: true,
        artistProfile: {
          select: {
            id: true,
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
      throw new UnauthorizedException('User not found for token');
    }

    return {
      userId: user.id,
      name: user.fullName,
      role: user.role,
      artistProfileId: user.artistProfile?.id ?? null,
      agencyId: user.ownedAgency?.id ?? null,
    };
  }

  private buildAccessWhere(actor: ActorContext): Prisma.BookingWhereInput {
    switch (actor.role) {
      case UserRole.CLIENT:
        return { clientId: actor.userId };
      case UserRole.ARTIST:
        return actor.artistProfileId ? { artistId: actor.artistProfileId } : { id: '__no-bookings__' };
      case UserRole.AGENCY:
        return actor.agencyId ? { agencyId: actor.agencyId } : { id: '__no-bookings__' };
      case UserRole.ADMIN:
      default:
        return {};
    }
  }

  private buildListWhere(
    actor: ActorContext,
    query: ListBookingsQueryDto,
  ): Prisma.BookingWhereInput {
    const conditions: Prisma.BookingWhereInput[] = [this.buildAccessWhere(actor)];

    if (query.status) {
      conditions.push({
        status: query.status as unknown as PrismaBookingStatus,
      });
    }

    if (query.startDate || query.endDate) {
      conditions.push({
        eventDate: {
          ...(query.startDate ? { gte: this.parseDate(query.startDate, 'startDate') } : {}),
          ...(query.endDate ? { lte: this.parseDate(query.endDate, 'endDate') } : {}),
        },
      });
    }

    return conditions.length === 1 ? conditions[0] : { AND: conditions };
  }

  private validateDateRange(query: ListBookingsQueryDto): void {
    if (!query.startDate || !query.endDate) {
      return;
    }
    const start = this.parseDate(query.startDate, 'startDate');
    const end = this.parseDate(query.endDate, 'endDate');
    if (start.getTime() > end.getTime()) {
      throw new BadRequestException('startDate cannot be after endDate');
    }
  }

  private async findAccessibleBookingOrThrow(
    actor: ActorContext,
    bookingId: string,
  ): Promise<BookingRecord> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        AND: [this.buildAccessWhere(actor), { id: bookingId }],
      },
      select: bookingSelect,
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  private async syncAutomaticStatuses(accessWhere: Prisma.BookingWhereInput): Promise<void> {
    const now = new Date();
    const completedCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const candidates = await this.prisma.booking.findMany({
      where: {
        AND: [
          accessWhere,
          {
            OR: [
              {
                status: PrismaBookingStatus.CONFIRMED,
                eventDate: { lte: now },
              },
              {
                status: PrismaBookingStatus.IN_PROGRESS,
                OR: [
                  { eventEndDate: { lte: completedCutoff } },
                  { eventEndDate: null, eventDate: { lte: completedCutoff } },
                ],
              },
            ],
          },
        ],
      },
      select: bookingSelect,
    });

    for (const booking of candidates) {
      await this.syncAutomaticStatus(booking);
    }
  }

  private async syncAutomaticStatus(booking: BookingRecord): Promise<boolean> {
    const now = new Date();
    if (booking.status === PrismaBookingStatus.CONFIRMED && booking.eventDate.getTime() <= now.getTime()) {
      return this.applyStatusChange(booking, {
        nextStatus: PrismaBookingStatus.IN_PROGRESS,
        action: 'auto_progress',
        notificationType: NotificationType.BOOKING_CONFIRMED,
        notificationTitle: 'Booking in progress',
        notificationBody: `"${booking.title}" is now in progress.`,
      });
    }

    const completionBase = booking.eventEndDate ?? booking.eventDate;
    if (
      booking.status === PrismaBookingStatus.IN_PROGRESS &&
      completionBase.getTime() <= now.getTime() - 24 * 60 * 60 * 1000
    ) {
      return this.applyStatusChange(booking, {
        nextStatus: PrismaBookingStatus.COMPLETED,
        action: 'auto_complete',
        notificationType: NotificationType.BOOKING_CONFIRMED,
        notificationTitle: 'Booking completed',
        notificationBody: `"${booking.title}" was automatically marked as completed.`,
      });
    }

    return false;
  }

  private resolveStatusChange(
    actor: ActorContext,
    booking: BookingRecord,
    input: UpdateBookingStatusDto,
  ): StatusChangePlan {
    const reason = this.normalizeOptionalString(input.reason);
    const actorLabel = actor.name;
    const isClient = booking.clientId === actor.userId;
    const isArtist = actor.artistProfileId !== null && booking.artistId === actor.artistProfileId;
    const isAgency = actor.agencyId !== null && booking.agencyId === actor.agencyId;
    const isAdmin = actor.role === UserRole.ADMIN;

    switch (input.action) {
      case 'confirm':
        if (booking.status !== PrismaBookingStatus.PENDING) {
          throw new BadRequestException('Only pending bookings can be confirmed');
        }
        if (!(isArtist || isAgency || isAdmin)) {
          throw new ForbiddenException('Only the artist, agency, or admin can confirm this booking');
        }
        return {
          nextStatus: PrismaBookingStatus.CONFIRMED,
          action: input.action,
          reason,
          notificationType: NotificationType.BOOKING_CONFIRMED,
          notificationTitle: 'Booking confirmed',
          notificationBody: `${actorLabel} confirmed "${booking.title}".`,
        };
      case 'cancel':
        if (booking.status !== PrismaBookingStatus.PENDING) {
          throw new BadRequestException('Only pending bookings can be cancelled');
        }
        if (!(isClient || isArtist || isAgency || isAdmin)) {
          throw new ForbiddenException('Only booking participants can cancel this booking');
        }
        return {
          nextStatus: PrismaBookingStatus.CANCELLED,
          action: input.action,
          reason,
          notificationType: NotificationType.BOOKING_CANCELLED,
          notificationTitle: 'Booking cancelled',
          notificationBody: `${actorLabel} cancelled "${booking.title}".${this.buildRefundStubText(booking)}`,
        };
      case 'complete':
        if (booking.status !== PrismaBookingStatus.IN_PROGRESS) {
          throw new BadRequestException('Only in-progress bookings can be completed');
        }
        if (!(isClient || isAdmin)) {
          throw new ForbiddenException('Only the client or admin can complete this booking');
        }
        return {
          nextStatus: PrismaBookingStatus.COMPLETED,
          action: input.action,
          reason,
          notificationType: NotificationType.BOOKING_CONFIRMED,
          notificationTitle: 'Booking completed',
          notificationBody: `${actorLabel} marked "${booking.title}" as completed.`,
        };
      case 'dispute':
        if (booking.status === PrismaBookingStatus.DISPUTED) {
          throw new BadRequestException('Booking is already disputed');
        }
        if (!(isClient || isArtist || isAgency || isAdmin)) {
          throw new ForbiddenException('Only booking participants can dispute this booking');
        }
        return {
          nextStatus: PrismaBookingStatus.DISPUTED,
          action: input.action,
          reason,
          notificationType: NotificationType.BOOKING_CANCELLED,
          notificationTitle: 'Booking disputed',
          notificationBody: `${actorLabel} opened a dispute for "${booking.title}".`,
        };
      default:
        throw new BadRequestException('Unsupported booking action');
    }
  }

  private async applyStatusChange(
    booking: BookingRecord,
    plan: StatusChangePlan,
    actor?: ActorContext,
  ): Promise<boolean> {
    const normalizedReason = this.normalizeOptionalString(plan.reason);

    const createdNotifications = await this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: booking.status,
        },
        data: {
          status: plan.nextStatus,
          updatedAt: new Date(),
          paymentProvider:
            plan.nextStatus === PrismaBookingStatus.CONFIRMED
              ? booking.paymentProvider ?? PaymentProvider.PAYFAST
              : booking.paymentProvider,
          paymentReference:
            plan.nextStatus === PrismaBookingStatus.CONFIRMED
              ? booking.paymentReference ?? this.buildPaymentReference(booking.id)
              : booking.paymentReference,
          cancelledAt: plan.nextStatus === PrismaBookingStatus.CANCELLED ? new Date() : booking.cancelledAt,
          cancelReason:
            plan.nextStatus === PrismaBookingStatus.CANCELLED
              ? normalizedReason
              : booking.cancelReason,
        },
      });

      if (result.count === 0) {
        return { changed: false, notifications: [] };
      }

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: plan.nextStatus,
          action: plan.action,
          reason: normalizedReason,
          actorUserId: actor?.userId ?? null,
          actorName: actor?.name ?? null,
          actorRole: actor?.role ?? null,
        },
      });

      const recipientIds = this.getNotificationRecipientIds(booking, actor?.userId ?? null);
      if (recipientIds.length > 0) {
        return {
          changed: true,
          notifications: await this.notificationsService.createMany(
            tx,
            recipientIds.map((recipientId) => ({
              userId: recipientId,
              type: plan.notificationType,
              title: plan.notificationTitle,
              body: plan.notificationBody,
              metadata: {
                bookingId: booking.id,
                action: plan.action,
                status: plan.nextStatus,
              },
            })),
          ),
        };
      }

      return { changed: true, notifications: [] };
    });

    this.notificationsService.emitMany(createdNotifications.notifications);
    return createdNotifications.changed;
  }

  private getNotificationRecipientIds(booking: BookingRecord, actorUserId: string | null): string[] {
    const ids = new Set<string>();
    ids.add(booking.clientId);
    if (booking.artist.userId) {
      ids.add(booking.artist.userId);
    }
    if (booking.agency?.ownerId) {
      ids.add(booking.agency.ownerId);
    }
    if (actorUserId) {
      ids.delete(actorUserId);
    }
    return Array.from(ids);
  }

  private buildRefundStubText(booking: BookingRecord): string {
    if (booking.paymentStatus !== PaymentStatus.PAID) {
      return '';
    }
    return ' Refund review has been queued for manual processing.';
  }

  private calculateAmounts(hourlyRate: Prisma.Decimal, eventDate: Date, eventEndDate: Date | null) {
    const rate = this.decimalToNumber(hourlyRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new BadRequestException('Selected artist does not have a valid hourly rate');
    }

    const durationHours = eventEndDate
      ? Math.max((eventEndDate.getTime() - eventDate.getTime()) / (60 * 60 * 1000), 1)
      : 1;
    const totalAmount = this.roundMoney(rate * durationHours);
    const platformFee = this.roundMoney(totalAmount * this.getPlatformFeePercent());
    const artistPayout = this.roundMoney(totalAmount - platformFee);

    return {
      totalAmount,
      platformFee,
      artistPayout,
    };
  }

  private getPlatformFeePercent(): number {
    const raw = Number.parseFloat(
      process.env.PLATFORM_FEE_PERCENT ?? process.env.STRIPE_PLATFORM_FEE_PERCENT ?? '10',
    );
    if (!Number.isFinite(raw) || raw < 0) {
      return 0.1;
    }
    return raw / 100;
  }

  private parseDate(value: string, fieldName: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid ISO date`);
    }
    return parsed;
  }

  private decimalToNumber(value: Prisma.Decimal): number {
    return Number(value.toString());
  }

  private roundMoney(value: number): number {
    return Number(value.toFixed(2));
  }

  private formatMoney(value: number): string {
    return `R${value.toFixed(2)}`;
  }

  private buildPaymentReference(bookingId: string): string {
    return bookingId;
  }

  private normalizeOptionalString(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private getInitials(name: string): string {
    const value = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
    return value || 'ART';
  }

  private toBookingResponse(booking: BookingRecord, actor: ActorContext): Booking {
    return {
      id: booking.id,
      clientId: booking.clientId,
      artistId: booking.artistId,
      agencyId: booking.agencyId,
      title: booking.title,
      description: booking.description,
      eventDate: booking.eventDate.toISOString(),
      eventEndDate: booking.eventEndDate?.toISOString() ?? null,
      location: booking.location,
      status: booking.status,
      totalAmount: this.decimalToNumber(booking.totalAmount),
      platformFee: this.decimalToNumber(booking.platformFee),
      artistPayout: this.decimalToNumber(booking.artistPayout),
      paymentProvider: booking.paymentProvider,
      paymentStatus: booking.paymentStatus,
      stripePaymentIntentId: booking.stripePaymentIntentId,
      paymentReference: booking.paymentReference,
      paymentGatewayReference: booking.paymentGatewayReference,
      paymentInitiatedAt: booking.paymentInitiatedAt?.toISOString() ?? null,
      paymentPaidAt: booking.paymentPaidAt?.toISOString() ?? null,
      paymentFailedAt: booking.paymentFailedAt?.toISOString() ?? null,
      notes: booking.notes,
      cancelledAt: booking.cancelledAt?.toISOString() ?? null,
      cancelReason: booking.cancelReason,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      client: {
        id: booking.client.id,
        name: booking.client.fullName,
        avatarUrl: booking.client.avatarUrl,
      },
      artist: {
        id: booking.artist.id,
        userId: booking.artist.userId,
        name: booking.artist.displayName,
        slug: booking.artist.slug,
        avatarUrl: booking.artist.user?.avatarUrl ?? null,
        hourlyRate: this.decimalToNumber(booking.artist.hourlyRate),
        location: booking.artist.location,
        isAvailable: booking.artist.isAvailable,
      },
      agency: booking.agency
        ? {
            id: booking.agency.id,
            ownerId: booking.agency.ownerId,
            name: booking.agency.name,
            slug: booking.agency.slug,
            logoUrl: booking.agency.logoUrl,
          }
        : null,
      review: booking.review
        ? {
            id: booking.review.id,
            rating: booking.review.rating,
            comment: booking.review.comment,
            isPublic: booking.review.isPublic,
            createdAt: booking.review.createdAt.toISOString(),
          }
        : null,
      canReview:
        actor.role === UserRole.CLIENT &&
        booking.clientId === actor.userId &&
        booking.status === PrismaBookingStatus.COMPLETED &&
        !booking.review,
      timeline: booking.statusHistory.map((event) => ({
        id: event.id,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        action: event.action,
        reason: event.reason,
        actorUserId: event.actorUserId,
        actorName: event.actorName,
        actorRole: event.actorRole,
        createdAt: event.createdAt.toISOString(),
      })),
      availableActions: this.getAvailableActions(actor, booking),
    };
  }

  private getAvailableActions(actor: ActorContext, booking: BookingRecord): BookingAction[] {
    const actions: BookingAction[] = [];
    const isClient = booking.clientId === actor.userId;
    const isArtist = actor.artistProfileId !== null && booking.artistId === actor.artistProfileId;
    const isAgency = actor.agencyId !== null && booking.agencyId === actor.agencyId;
    const isAdmin = actor.role === UserRole.ADMIN;

    if (booking.status === PrismaBookingStatus.PENDING && (isArtist || isAgency || isAdmin)) {
      actions.push('confirm');
    }

    if (booking.status === PrismaBookingStatus.PENDING && (isClient || isArtist || isAgency || isAdmin)) {
      actions.push('cancel');
    }

    if (booking.status === PrismaBookingStatus.IN_PROGRESS && (isClient || isAdmin)) {
      actions.push('complete');
    }

    if (booking.status !== PrismaBookingStatus.DISPUTED && (isClient || isArtist || isAgency || isAdmin)) {
      actions.push('dispute');
    }

    return actions;
  }
}
