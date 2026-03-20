import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BookingStatus as PrismaBookingStatus,
  BookingVerificationStatus,
  NotificationType,
  OnboardingFeeModel,
  PaymentProvider,
  PaymentStatus,
  PayoutStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import type { ApiResponse, Booking, BookingAction } from '@vendorapp/shared';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { ArtistTierService } from '../artists/artist-tier.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformConfigService } from '../platform/platform-config.service';
import { PrismaService } from '../prisma/prisma.service';
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
  verificationCodeCiphertext: true,
  verificationCodeSentAt: true,
  verificationCodeExpiresAt: true,
  verificationStatus: true,
  verificationAttempts: true,
  verificationEnteredAt: true,
  verificationEnteredByUserId: true,
  verificationOverrideByUserId: true,
  verificationOverrideReason: true,
  jobStartedAt: true,
  jobCompletedAt: true,
  clientApprovedAt: true,
  disputeOpenedAt: true,
  disputeWindowEndsAt: true,
  disputeWindowDays: true,
  payoutStatus: true,
  payoutPendingAt: true,
  estimatedPayoutReleaseAt: true,
  payoutReleasedAt: true,
  payoutHoldReason: true,
  payoutDelayDaysSnapshot: true,
  payoutOverrideByUserId: true,
  payoutOverrideReason: true,
  normalCommissionRate: true,
  appliedCommissionRate: true,
  onboardingExtraCutAmount: true,
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
      normalCommissionRate: true,
      temporaryFirstBookingCommissionRate: true,
      onboardingFeeModel: true,
      firstBookingOnboardingDeductionApplied: true,
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
  auditEvents: {
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      actorUserId: true,
      eventType: true,
      message: true,
      metadata: true,
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
  updateData?: Prisma.BookingUpdateManyMutationInput;
  auditType?: string;
  auditMessage?: string;
};

const startCodeStatuses: PrismaBookingStatus[] = [
  PrismaBookingStatus.BOOKED,
  PrismaBookingStatus.AWAITING_START_CODE,
];

const verifiedBookingStatuses: BookingVerificationStatus[] = [
  BookingVerificationStatus.VERIFIED,
  BookingVerificationStatus.MANUAL_OVERRIDE,
];

const cancellableBookingStatuses: PrismaBookingStatus[] = [
  PrismaBookingStatus.PENDING,
  PrismaBookingStatus.CONFIRMED,
];

const disputeWindowStatuses: PrismaBookingStatus[] = [
  PrismaBookingStatus.COMPLETED,
  PrismaBookingStatus.PAYOUT_PENDING,
];

const reviewableBookingStatuses: PrismaBookingStatus[] = [
  PrismaBookingStatus.COMPLETED,
  PrismaBookingStatus.PAYOUT_PENDING,
  PrismaBookingStatus.PAYOUT_RELEASED,
];

const disputableBookingStatuses: PrismaBookingStatus[] = [
  PrismaBookingStatus.BOOKED,
  PrismaBookingStatus.AWAITING_START_CODE,
  PrismaBookingStatus.IN_PROGRESS,
  PrismaBookingStatus.AWAITING_CLIENT_APPROVAL,
  PrismaBookingStatus.COMPLETED,
  PrismaBookingStatus.PAYOUT_PENDING,
];

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly artistTierService: ArtistTierService,
    private readonly platformConfigService: PlatformConfigService,
  ) {}

  async findAll(userId: string, query: ListBookingsQueryDto): Promise<ApiResponse<Booking[]>> {
    const actor = await this.getActorContext(userId);
    this.validateDateRange(query);

    await this.syncAutomaticStatuses(this.buildAccessWhere(actor));

    const where = this.buildListWhere(actor, query);
    const total = await this.prisma.booking.count({ where });
    const bookings = await this.prisma.booking.findMany({
      where,
      orderBy: [{ eventDate: 'asc' }, { createdAt: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: bookingSelect,
    });

    return {
      data: bookings.map((booking) => this.toBookingResponse(booking, actor)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(userId: string, bookingId: string): Promise<ApiResponse<Booking>> {
    const actor = await this.getActorContext(userId);
    let booking = await this.findAccessibleBookingOrThrow(actor, bookingId);
    if (await this.syncAutomaticStatus(booking)) {
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
        isLive: true,
        normalCommissionRate: true,
      },
    });
    if (!artist) {
      throw new NotFoundException('Artist not found');
    }
    if (!artist.isLive) {
      throw new BadRequestException('Selected artist is not live for bookings yet');
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

    const settings = await this.platformConfigService.getSettings();
    const commissionRate = Number(artist.normalCommissionRate.toString());
    const amounts = this.calculateAmounts(artist.hourlyRate, commissionRate, eventDate, eventEndDate);
    const bookingId = `bk-${randomBytes(8).toString('hex')}`;

    const createdNotifications = await this.prisma.$transaction(async (tx) => {
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
          paymentStatus: PaymentStatus.UNPAID,
          paymentProvider: null,
          paymentReference: null,
          paymentGatewayReference: null,
          paymentInitiatedAt: null,
          paymentPaidAt: null,
          paymentFailedAt: null,
          notes: this.normalizeOptionalString(input.notes),
          artistName: artist.displayName,
          artistInitials: this.getInitials(artist.displayName),
          date: eventDate.toISOString(),
          amount: this.formatMoney(amounts.totalAmount),
          applications: 0,
          verificationStatus: BookingVerificationStatus.NOT_REQUIRED,
          disputeWindowDays: settings.disputeWindowDays,
          payoutStatus: PayoutStatus.NOT_READY,
          normalCommissionRate: commissionRate.toFixed(2),
          appliedCommissionRate: commissionRate.toFixed(2),
          onboardingExtraCutAmount: '0',
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: null,
          toStatus: PrismaBookingStatus.PENDING,
          action: 'create',
          reason: `Booking created by ${actor.name}`,
          actorUserId: actor.userId,
          actorName: actor.name,
          actorRole: actor.role,
        },
      });

      await this.createAuditEvent(
        tx,
        bookingId,
        'booking_created',
        actor.userId,
        'Booking created.',
        { status: PrismaBookingStatus.PENDING },
      );

      if (!artist.userId) {
        return [];
      }

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
    });

    this.notificationsService.emitMany(createdNotifications);
    const booking = await this.findAccessibleBookingOrThrow(actor, bookingId);
    return { data: this.toBookingResponse(booking, actor) };
  }

  async updateStatus(
    userId: string,
    bookingId: string,
    input: UpdateBookingStatusDto,
  ): Promise<ApiResponse<Booking>> {
    const actor = await this.getActorContext(userId);
    let booking = await this.findAccessibleBookingOrThrow(actor, bookingId);
    if (await this.syncAutomaticStatus(booking)) {
      booking = await this.findAccessibleBookingOrThrow(actor, bookingId);
    }

    switch (input.action) {
      case 'confirm':
        await this.confirmBooking(actor, booking, input.reason);
        break;
      case 'cancel':
        await this.cancelBooking(actor, booking, input.reason);
        break;
      case 'complete':
        await this.completeBooking(actor, booking, input.reason);
        break;
      case 'approve_completion':
        await this.approveCompletion(actor, booking, input.reason);
        break;
      case 'dispute':
        await this.disputeBooking(actor, booking, input.reason);
        break;
      default:
        throw new BadRequestException('Unsupported booking action');
    }

    const updated = await this.findAccessibleBookingOrThrow(actor, bookingId);
    return { data: this.toBookingResponse(updated, actor) };
  }

  async verifyStartCode(
    userId: string,
    bookingId: string,
    code: string,
  ): Promise<ApiResponse<Booking>> {
    const actor = await this.getActorContext(userId);
    const booking = await this.findAccessibleBookingOrThrow(actor, bookingId);
    const isArtist = actor.artistProfileId !== null && booking.artistId === actor.artistProfileId;
    const isAgency = actor.agencyId !== null && booking.agencyId === actor.agencyId;

    if (!(isArtist || isAgency || this.isAdminRole(actor.role))) {
      throw new ForbiddenException('Only the artist, agency, or admin can start the booking');
    }
    if (!startCodeStatuses.includes(booking.status)) {
      throw new BadRequestException('This booking is not waiting for a start code');
    }
    if (booking.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('The booking must be paid before work can begin');
    }
    if (!booking.verificationCodeCiphertext) {
      throw new BadRequestException('No verification code has been generated for this booking');
    }
    if (
      booking.verificationCodeExpiresAt &&
      booking.verificationCodeExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('The verification code has expired and now requires support review');
    }

    const normalizedCode = code.trim();
    const expectedCode = this.decryptVerificationCode(booking.verificationCodeCiphertext);
    if (normalizedCode !== expectedCode) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          verificationAttempts: {
            increment: 1,
          },
          verificationStatus: BookingVerificationStatus.FAILED,
        },
      });
      await this.createAuditEvent(
        this.prisma,
        booking.id,
        'booking_start_code_failed',
        actor.userId,
        'Incorrect safety code submitted.',
        { attempts: booking.verificationAttempts + 1 },
      );
      throw new BadRequestException('The verification code is incorrect');
    }

    await this.applyStatusChange(
      booking,
      {
        nextStatus: PrismaBookingStatus.IN_PROGRESS,
        action: 'verify_start_code',
        notificationType: NotificationType.BOOKING_CONFIRMED,
        notificationTitle: 'Booking started',
        notificationBody: `"${booking.title}" is now in progress.`,
        updateData: {
          verificationStatus: BookingVerificationStatus.VERIFIED,
          verificationEnteredAt: new Date(),
          verificationEnteredByUserId: actor.userId,
          jobStartedAt: new Date(),
          payoutHoldReason: null,
        },
        auditType: 'booking_started',
        auditMessage: 'Booking start code verified successfully.',
      },
      actor,
    );

    const updated = await this.findAccessibleBookingOrThrow(actor, booking.id);
    return { data: this.toBookingResponse(updated, actor) };
  }

  async applyAdminOverride(
    userId: string,
    bookingId: string,
    input: {
      action: 'verify_without_code' | 'hold_payout' | 'release_payout' | 'resolve_dispute';
      reason?: string;
    },
  ): Promise<ApiResponse<Booking>> {
    const actor = await this.getActorContext(userId);
    if (!this.isAdminRole(actor.role)) {
      throw new ForbiddenException('Only admins can apply booking overrides');
    }

    const booking = await this.findAccessibleBookingOrThrow(actor, bookingId);
    const reason = this.normalizeOptionalString(input.reason) ?? 'Admin override applied';

    switch (input.action) {
      case 'verify_without_code':
        if (!startCodeStatuses.includes(booking.status)) {
          throw new BadRequestException('Only booked jobs can be manually verified');
        }
        await this.applyStatusChange(
          booking,
          {
            nextStatus: PrismaBookingStatus.IN_PROGRESS,
            action: 'admin_verify_without_code',
            reason,
            notificationType: NotificationType.BOOKING_CONFIRMED,
            notificationTitle: 'Booking manually verified',
            notificationBody: `An admin manually verified "${booking.title}".`,
            updateData: {
              verificationStatus: BookingVerificationStatus.MANUAL_OVERRIDE,
              verificationOverrideByUserId: actor.userId,
              verificationOverrideReason: reason,
              verificationEnteredAt: new Date(),
              jobStartedAt: new Date(),
            },
            auditType: 'booking_verification_overridden',
            auditMessage: reason,
          },
          actor,
        );
        break;
      case 'hold_payout':
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            payoutStatus: PayoutStatus.ON_HOLD,
            payoutHoldReason: reason,
            payoutOverrideByUserId: actor.userId,
            payoutOverrideReason: reason,
          },
        });
        await this.createAuditEvent(this.prisma, booking.id, 'booking_payout_held', actor.userId, reason, {
          payoutStatus: PayoutStatus.ON_HOLD,
        });
        break;
      case 'release_payout':
        await this.releasePayout(booking, actor, true, reason);
        break;
      case 'resolve_dispute':
        if (booking.status !== PrismaBookingStatus.DISPUTED) {
          throw new BadRequestException('Only disputed bookings can be resolved');
        }
        await this.applyStatusChange(
          booking,
          {
            nextStatus: PrismaBookingStatus.COMPLETED,
            action: 'admin_resolve_dispute',
            reason,
            notificationType: NotificationType.BOOKING_CONFIRMED,
            notificationTitle: 'Dispute resolved',
            notificationBody: `An admin resolved the dispute for "${booking.title}".`,
            updateData: {
              payoutStatus: PayoutStatus.MANUAL_REVIEW,
              payoutHoldReason: reason,
              payoutOverrideByUserId: actor.userId,
              payoutOverrideReason: reason,
            },
            auditType: 'booking_dispute_resolved',
            auditMessage: reason,
          },
          actor,
        );
        break;
      default:
        throw new BadRequestException('Unsupported admin override action');
    }

    const updated = await this.findAccessibleBookingOrThrow(actor, booking.id);
    return { data: this.toBookingResponse(updated, actor) };
  }

  private async getActorContext(userId: string): Promise<ActorContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        role: true,
        artistProfile: { select: { id: true } },
        ownedAgency: { select: { id: true } },
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
      default:
        return {};
    }
  }

  private buildListWhere(actor: ActorContext, query: ListBookingsQueryDto): Prisma.BookingWhereInput {
    const conditions: Prisma.BookingWhereInput[] = [this.buildAccessWhere(actor)];

    if (query.status) {
      conditions.push({ status: query.status as unknown as PrismaBookingStatus });
    }
    if (query.startDate || query.endDate) {
      conditions.push({
        eventDate: {
          ...(query.startDate ? { gte: this.parseDate(query.startDate, 'startDate') } : {}),
          ...(query.endDate ? { lte: this.parseDate(query.endDate, 'endDate') } : {}),
        },
      });
    }
    if (query.payoutStatus) {
      conditions.push({ payoutStatus: query.payoutStatus });
    }
    if (query.verificationStatus) {
      conditions.push({ verificationStatus: query.verificationStatus });
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

  private async findAccessibleBookingOrThrow(actor: ActorContext, bookingId: string): Promise<BookingRecord> {
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
    const settings = await this.platformConfigService.getSettings();
    const now = new Date();
    const approvalCutoff = new Date(now.getTime() - settings.clientApprovalGraceHours * 60 * 60 * 1000);

    const candidates = await this.prisma.booking.findMany({
      where: {
        AND: [
          accessWhere,
          {
            OR: [
              { status: PrismaBookingStatus.BOOKED },
              { status: PrismaBookingStatus.AWAITING_CLIENT_APPROVAL, jobCompletedAt: { lte: approvalCutoff } },
              { status: PrismaBookingStatus.COMPLETED, disputeWindowEndsAt: { lte: now } },
              { status: PrismaBookingStatus.PAYOUT_PENDING, estimatedPayoutReleaseAt: { lte: now } },
            ],
          },
        ],
      },
      select: bookingSelect,
    });

    for (const booking of candidates) {
      await this.syncAutomaticStatus(booking, settings);
    }
  }

  private async syncAutomaticStatus(
    booking: BookingRecord,
    settings?: Awaited<ReturnType<PlatformConfigService['getSettings']>>,
  ): Promise<boolean> {
    const currentSettings = settings ?? (await this.platformConfigService.getSettings());
    const now = new Date();
    const activationCutoff = new Date(now.getTime() + currentSettings.startCodeActivationHours * 60 * 60 * 1000);

    if (booking.status === PrismaBookingStatus.BOOKED && booking.eventDate.getTime() <= activationCutoff.getTime()) {
      return this.applyStatusChange(
        booking,
        {
          nextStatus: PrismaBookingStatus.AWAITING_START_CODE,
          action: 'auto_await_start_code',
          notificationType: NotificationType.BOOKING_CONFIRMED,
          notificationTitle: 'Booking awaiting safety code',
          notificationBody: `"${booking.title}" is now waiting for the safety code.`,
          auditType: 'booking_awaiting_start_code',
          auditMessage: 'Booking entered the start-code verification window.',
        },
      );
    }

    if (
      booking.status === PrismaBookingStatus.AWAITING_CLIENT_APPROVAL &&
      booking.jobCompletedAt &&
      booking.jobCompletedAt.getTime() <= now.getTime() - currentSettings.clientApprovalGraceHours * 60 * 60 * 1000
    ) {
      return this.applyStatusChange(
        booking,
        {
          nextStatus: PrismaBookingStatus.COMPLETED,
          action: 'auto_complete_approval',
          notificationType: NotificationType.BOOKING_CONFIRMED,
          notificationTitle: 'Booking completed',
          notificationBody: `"${booking.title}" was auto-completed after the approval window elapsed.`,
          updateData: {
            disputeWindowDays: currentSettings.disputeWindowDays,
            disputeWindowEndsAt: new Date(now.getTime() + currentSettings.disputeWindowDays * 24 * 60 * 60 * 1000),
          },
          auditType: 'booking_auto_completed',
          auditMessage: 'Client approval window expired and the booking was auto-completed.',
        },
      );
    }

    if (booking.status === PrismaBookingStatus.COMPLETED && booking.disputeWindowEndsAt && booking.disputeWindowEndsAt.getTime() <= now.getTime()) {
      if (!verifiedBookingStatuses.includes(booking.verificationStatus)) {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            payoutStatus: PayoutStatus.MANUAL_REVIEW,
            payoutHoldReason: booking.payoutHoldReason ?? 'Safety code was never verified. Manual review is required before payout.',
          },
        });
        await this.createAuditEvent(
          this.prisma,
          booking.id,
          'booking_payout_manual_review_required',
          null,
          'Payout blocked because the booking was never code-verified.',
          { verificationStatus: booking.verificationStatus },
        );
        return true;
      }

      await this.moveToPayoutPending(booking, undefined, false, 'Dispute window elapsed.');
      return true;
    }

    if (
      booking.status === PrismaBookingStatus.PAYOUT_PENDING &&
      booking.payoutStatus === PayoutStatus.PENDING &&
      booking.estimatedPayoutReleaseAt &&
      booking.estimatedPayoutReleaseAt.getTime() <= now.getTime()
    ) {
      await this.releasePayout(booking, undefined, false, 'Payout release timing reached.');
      return true;
    }

    return false;
  }

  private async confirmBooking(actor: ActorContext, booking: BookingRecord, reason?: string): Promise<void> {
    const isArtist = actor.artistProfileId !== null && booking.artistId === actor.artistProfileId;
    const isAgency = actor.agencyId !== null && booking.agencyId === actor.agencyId;
    if (!(isArtist || isAgency || this.isAdminRole(actor.role))) {
      throw new ForbiddenException('Only the artist, agency, or admin can confirm this booking');
    }
    if (booking.status !== PrismaBookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be confirmed');
    }

    await this.applyStatusChange(
      booking,
      {
        nextStatus: PrismaBookingStatus.CONFIRMED,
        action: 'confirm',
        reason,
        notificationType: NotificationType.BOOKING_CONFIRMED,
        notificationTitle: 'Booking confirmed',
        notificationBody: `${actor.name} confirmed "${booking.title}".`,
        updateData: {
          paymentProvider: booking.paymentProvider ?? PaymentProvider.PAYFAST,
          paymentReference: booking.paymentReference ?? this.buildPaymentReference(booking.id),
        },
        auditType: 'booking_confirmed',
        auditMessage: 'Booking confirmed and waiting for payment.',
      },
      actor,
    );
  }

  private async cancelBooking(actor: ActorContext, booking: BookingRecord, reason?: string): Promise<void> {
    const isParticipant =
      booking.clientId === actor.userId ||
      (actor.artistProfileId !== null && booking.artistId === actor.artistProfileId) ||
      (actor.agencyId !== null && booking.agencyId === actor.agencyId) ||
      this.isAdminRole(actor.role);

    if (!isParticipant) {
      throw new ForbiddenException('Only booking participants can cancel this booking');
    }
    if (!cancellableBookingStatuses.includes(booking.status)) {
      throw new BadRequestException('Only pending or unpaid confirmed bookings can be cancelled');
    }
    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Paid bookings must be handled through support review');
    }

    await this.applyStatusChange(
      booking,
      {
        nextStatus: PrismaBookingStatus.CANCELLED,
        action: 'cancel',
        reason,
        notificationType: NotificationType.BOOKING_CANCELLED,
        notificationTitle: 'Booking cancelled',
        notificationBody: `${actor.name} cancelled "${booking.title}".`,
        updateData: {
          cancelledAt: new Date(),
          cancelReason: this.normalizeOptionalString(reason),
          payoutStatus: PayoutStatus.NOT_READY,
        },
        auditType: 'booking_cancelled',
        auditMessage: reason ?? 'Booking cancelled.',
      },
      actor,
    );
  }

  private async completeBooking(actor: ActorContext, booking: BookingRecord, reason?: string): Promise<void> {
    const isArtist = actor.artistProfileId !== null && booking.artistId === actor.artistProfileId;
    const isAgency = actor.agencyId !== null && booking.agencyId === actor.agencyId;
    if (!(isArtist || isAgency || this.isAdminRole(actor.role))) {
      throw new ForbiddenException('Only the artist, agency, or admin can complete this booking');
    }
    if (booking.status !== PrismaBookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress bookings can be completed');
    }
    if (!verifiedBookingStatuses.includes(booking.verificationStatus)) {
      throw new BadRequestException('This booking was not properly verified before starting');
    }

    await this.applyStatusChange(
      booking,
      {
        nextStatus: PrismaBookingStatus.AWAITING_CLIENT_APPROVAL,
        action: 'complete',
        reason,
        notificationType: NotificationType.BOOKING_CONFIRMED,
        notificationTitle: 'Awaiting client approval',
        notificationBody: `${actor.name} marked "${booking.title}" as complete.`,
        updateData: {
          jobCompletedAt: new Date(),
        },
        auditType: 'booking_marked_complete',
        auditMessage: reason ?? 'Artist marked the booking as complete.',
      },
      actor,
    );
  }

  private async approveCompletion(actor: ActorContext, booking: BookingRecord, reason?: string): Promise<void> {
    if (!(booking.clientId === actor.userId || this.isAdminRole(actor.role))) {
      throw new ForbiddenException('Only the client or admin can approve completion');
    }
    if (booking.status !== PrismaBookingStatus.AWAITING_CLIENT_APPROVAL) {
      throw new BadRequestException('This booking is not awaiting client approval');
    }

    const settings = await this.platformConfigService.getSettings();
    await this.applyStatusChange(
      booking,
      {
        nextStatus: PrismaBookingStatus.COMPLETED,
        action: 'approve_completion',
        reason,
        notificationType: NotificationType.BOOKING_CONFIRMED,
        notificationTitle: 'Booking approved',
        notificationBody: `${actor.name} approved completion for "${booking.title}".`,
        updateData: {
          clientApprovedAt: new Date(),
          disputeWindowDays: settings.disputeWindowDays,
          disputeWindowEndsAt: new Date(Date.now() + settings.disputeWindowDays * 24 * 60 * 60 * 1000),
        },
        auditType: 'booking_completion_approved',
        auditMessage: reason ?? 'Client approved completion.',
      },
      actor,
    );
  }

  private async disputeBooking(actor: ActorContext, booking: BookingRecord, reason?: string): Promise<void> {
    const isParticipant =
      booking.clientId === actor.userId ||
      (actor.artistProfileId !== null && booking.artistId === actor.artistProfileId) ||
      (actor.agencyId !== null && booking.agencyId === actor.agencyId) ||
      this.isAdminRole(actor.role);

    if (!isParticipant) {
      throw new ForbiddenException('Only booking participants can dispute this booking');
    }
    if (booking.status === PrismaBookingStatus.DISPUTED) {
      throw new BadRequestException('Booking is already disputed');
    }
    if (disputeWindowStatuses.includes(booking.status)) {
      const disputeWindowOpen = !booking.disputeWindowEndsAt || booking.disputeWindowEndsAt.getTime() >= Date.now();
      if (!disputeWindowOpen && !this.isAdminRole(actor.role)) {
        throw new BadRequestException('The standard dispute window has expired. Please escalate through support for manual review.');
      }
    }

    await this.applyStatusChange(
      booking,
      {
        nextStatus: PrismaBookingStatus.DISPUTED,
        action: 'dispute',
        reason,
        notificationType: NotificationType.BOOKING_CANCELLED,
        notificationTitle: 'Booking disputed',
        notificationBody: `${actor.name} opened a dispute for "${booking.title}".`,
        updateData: {
          disputeOpenedAt: new Date(),
          payoutStatus: PayoutStatus.ON_HOLD,
          payoutHoldReason: reason ?? 'Dispute opened',
        },
        auditType: 'booking_disputed',
        auditMessage: reason ?? 'A dispute was opened for this booking.',
      },
      actor,
    );
  }

  private async moveToPayoutPending(
    booking: BookingRecord,
    actor?: ActorContext,
    manualOverride = false,
    reason?: string,
  ): Promise<void> {
    const now = new Date();
    const payoutDelayDays = await this.resolvePayoutDelayDays(booking.artistId);

    await this.prisma.$transaction(async (tx) => {
      let platformFee = Number(booking.platformFee.toString());
      let artistPayout = Number(booking.artistPayout.toString());
      let appliedCommissionRate = Number(booking.appliedCommissionRate.toString());
      let onboardingExtraCutAmount = Number(booking.onboardingExtraCutAmount.toString());

      if (
        booking.artist.onboardingFeeModel === OnboardingFeeModel.FIRST_BOOKING_DEDUCTION &&
        !booking.artist.firstBookingOnboardingDeductionApplied
      ) {
        const claimed = await tx.artist.updateMany({
          where: {
            id: booking.artistId,
            firstBookingOnboardingDeductionApplied: false,
          },
          data: {
            firstBookingOnboardingDeductionApplied: true,
            firstBookingOnboardingDeductionAt: now,
          },
        });

        if (claimed.count > 0) {
          const normalRate = Number(booking.artist.normalCommissionRate.toString());
          appliedCommissionRate = Number(booking.artist.temporaryFirstBookingCommissionRate.toString());
          platformFee = this.roundMoney((Number(booking.totalAmount.toString()) * appliedCommissionRate) / 100);
          artistPayout = this.roundMoney(Number(booking.totalAmount.toString()) - platformFee);
          onboardingExtraCutAmount = this.roundMoney(
            Number(booking.totalAmount.toString()) * ((appliedCommissionRate - normalRate) / 100),
          );
        }
      }

      const result = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: booking.status,
        },
        data: {
          status: PrismaBookingStatus.PAYOUT_PENDING,
          payoutStatus: PayoutStatus.PENDING,
          payoutPendingAt: now,
          estimatedPayoutReleaseAt: new Date(now.getTime() + payoutDelayDays * 24 * 60 * 60 * 1000),
          payoutDelayDaysSnapshot: payoutDelayDays,
          payoutHoldReason: null,
          normalCommissionRate: Number(booking.artist.normalCommissionRate.toString()).toFixed(2),
          appliedCommissionRate: appliedCommissionRate.toFixed(2),
          platformFee: platformFee.toFixed(2),
          artistPayout: artistPayout.toFixed(2),
          onboardingExtraCutAmount: onboardingExtraCutAmount.toFixed(2),
          payoutOverrideByUserId: manualOverride ? actor?.userId ?? null : booking.payoutOverrideByUserId,
          payoutOverrideReason: manualOverride ? reason ?? null : booking.payoutOverrideReason,
        },
      });

      if (result.count === 0) {
        return;
      }

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: PrismaBookingStatus.PAYOUT_PENDING,
          action: manualOverride ? 'admin_move_to_payout_pending' : 'auto_move_to_payout_pending',
          reason: reason ?? null,
          actorUserId: actor?.userId ?? null,
          actorName: actor?.name ?? null,
          actorRole: actor?.role ?? null,
        },
      });

      await this.createAuditEvent(tx, booking.id, 'booking_payout_pending', actor?.userId ?? null, reason ?? 'Booking moved into payout pending.', {
        payoutDelayDays,
        appliedCommissionRate,
        onboardingExtraCutAmount,
        manualOverride,
      });

      const notifications = await this.notificationsService.createMany(
        tx,
        this.getNotificationRecipientIds(booking, actor?.userId ?? null).map((userId) => ({
          userId,
          type: NotificationType.PAYOUT_STATUS_UPDATED,
          title: 'Payout pending',
          body: `Payout for "${booking.title}" is pending release.`,
          metadata: {
            bookingId: booking.id,
            payoutStatus: PayoutStatus.PENDING,
            estimatedPayoutReleaseAt: new Date(now.getTime() + payoutDelayDays * 24 * 60 * 60 * 1000).toISOString(),
          },
        })),
      );
      this.notificationsService.emitMany(notifications);
    });

    await this.artistTierService.refreshArtistTier(booking.artistId);
  }

  private async releasePayout(
    booking: BookingRecord,
    actor?: ActorContext,
    manualOverride = false,
    reason?: string,
  ): Promise<void> {
    const now = new Date();
    const createdNotifications = await this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: booking.status,
        },
        data: {
          status: PrismaBookingStatus.PAYOUT_RELEASED,
          payoutStatus: PayoutStatus.RELEASED,
          payoutReleasedAt: now,
          payoutHoldReason: null,
          payoutOverrideByUserId: manualOverride ? actor?.userId ?? null : booking.payoutOverrideByUserId,
          payoutOverrideReason: manualOverride ? reason ?? null : booking.payoutOverrideReason,
        },
      });

      if (result.count === 0) {
        return [] as Awaited<ReturnType<NotificationsService['createMany']>>;
      }

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: PrismaBookingStatus.PAYOUT_RELEASED,
          action: manualOverride ? 'admin_release_payout' : 'auto_release_payout',
          reason: reason ?? null,
          actorUserId: actor?.userId ?? null,
          actorName: actor?.name ?? null,
          actorRole: actor?.role ?? null,
        },
      });

      await this.createAuditEvent(tx, booking.id, 'booking_payout_released', actor?.userId ?? null, reason ?? 'Payout released to artist.', {
        manualOverride,
        payoutStatus: PayoutStatus.RELEASED,
      });

      return this.notificationsService.createMany(
        tx,
        this.getNotificationRecipientIds(booking, actor?.userId ?? null).map((userId) => ({
          userId,
          type: NotificationType.PAYOUT_STATUS_UPDATED,
          title: 'Payout released',
          body: `Payout for "${booking.title}" has been released.`,
          metadata: {
            bookingId: booking.id,
            payoutStatus: PayoutStatus.RELEASED,
            payoutReleasedAt: now.toISOString(),
          },
        })),
      );
    });

    this.notificationsService.emitMany(createdNotifications);
    await this.artistTierService.refreshArtistTier(booking.artistId);
  }

  private async resolvePayoutDelayDays(artistId: string): Promise<number> {
    const progress = await this.artistTierService.refreshArtistTier(artistId);
    const value = progress.currentTier?.benefits?.payoutDelayDays;
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return value;
    }
    return 7;
  }

  private async applyStatusChange(booking: BookingRecord, plan: StatusChangePlan, actor?: ActorContext): Promise<boolean> {
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
          ...(plan.updateData ?? {}),
        },
      });

      if (result.count === 0) {
        return { changed: false, notifications: [] as Awaited<ReturnType<NotificationsService['createMany']>> };
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

      await this.createAuditEvent(
        tx,
        booking.id,
        plan.auditType ?? plan.action,
        actor?.userId ?? null,
        plan.auditMessage ?? normalizedReason ?? plan.notificationTitle,
        { fromStatus: booking.status, toStatus: plan.nextStatus },
      );

      const notifications = await this.notificationsService.createMany(
        tx,
        this.getNotificationRecipientIds(booking, actor?.userId ?? null).map((userId) => ({
          userId,
          type: plan.notificationType,
          title: plan.notificationTitle,
          body: plan.notificationBody,
          metadata: {
            bookingId: booking.id,
            action: plan.action,
            status: plan.nextStatus,
          },
        })),
      );

      return { changed: true, notifications };
    });

    this.notificationsService.emitMany(createdNotifications.notifications);
    await this.artistTierService.refreshArtistTier(booking.artistId);
    return createdNotifications.changed;
  }

  private getNotificationRecipientIds(booking: BookingRecord, actorUserId: string | null): string[] {
    const ids = new Set<string>([booking.clientId]);
    if (booking.artist.userId) ids.add(booking.artist.userId);
    if (booking.agency?.ownerId) ids.add(booking.agency.ownerId);
    if (actorUserId) ids.delete(actorUserId);
    return Array.from(ids);
  }

  private async createAuditEvent(
    db: PrismaService | Prisma.TransactionClient,
    bookingId: string,
    eventType: string,
    actorUserId: string | null,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await db.bookingAuditEvent.create({
      data: {
        bookingId,
        actorUserId,
        eventType,
        message,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });
  }

  private calculateAmounts(hourlyRate: Prisma.Decimal, commissionRate: number, eventDate: Date, eventEndDate: Date | null) {
    const rate = this.decimalToNumber(hourlyRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new BadRequestException('Selected artist does not have a valid hourly rate');
    }
    const durationHours = eventEndDate ? Math.max((eventEndDate.getTime() - eventDate.getTime()) / 3600000, 1) : 1;
    const totalAmount = this.roundMoney(rate * durationHours);
    const platformFee = this.roundMoney((totalAmount * commissionRate) / 100);
    return {
      totalAmount,
      platformFee,
      artistPayout: this.roundMoney(totalAmount - platformFee),
    };
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
    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'ART'
    );
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
      verificationStatus: booking.verificationStatus,
      verificationCode:
        booking.verificationCodeCiphertext &&
        (booking.clientId === actor.userId || this.isAdminRole(actor.role))
          ? this.decryptVerificationCode(booking.verificationCodeCiphertext)
          : null,
      verificationCodeSentAt: booking.verificationCodeSentAt?.toISOString() ?? null,
      verificationCodeExpiresAt: booking.verificationCodeExpiresAt?.toISOString() ?? null,
      verificationEnteredAt: booking.verificationEnteredAt?.toISOString() ?? null,
      verificationAttempts: booking.verificationAttempts,
      jobStartedAt: booking.jobStartedAt?.toISOString() ?? null,
      jobCompletedAt: booking.jobCompletedAt?.toISOString() ?? null,
      clientApprovedAt: booking.clientApprovedAt?.toISOString() ?? null,
      disputeOpenedAt: booking.disputeOpenedAt?.toISOString() ?? null,
      disputeWindowDays: booking.disputeWindowDays,
      disputeWindowEndsAt: booking.disputeWindowEndsAt?.toISOString() ?? null,
      payoutStatus: booking.payoutStatus,
      payoutPendingAt: booking.payoutPendingAt?.toISOString() ?? null,
      estimatedPayoutReleaseAt: booking.estimatedPayoutReleaseAt?.toISOString() ?? null,
      payoutReleasedAt: booking.payoutReleasedAt?.toISOString() ?? null,
      payoutHoldReason: booking.payoutHoldReason,
      payoutDelayDaysSnapshot: booking.payoutDelayDaysSnapshot,
      normalCommissionRate: this.decimalToNumber(booking.normalCommissionRate),
      appliedCommissionRate: this.decimalToNumber(booking.appliedCommissionRate),
      onboardingExtraCutAmount: this.decimalToNumber(booking.onboardingExtraCutAmount),
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
        reviewableBookingStatuses.includes(booking.status) &&
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
      auditEvents: booking.auditEvents.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        message: event.message,
        actorUserId: event.actorUserId,
        createdAt: event.createdAt.toISOString(),
        metadata: this.normalizeMetadata(event.metadata),
      })),
      availableActions: this.getAvailableActions(actor, booking),
    };
  }

  private getAvailableActions(actor: ActorContext, booking: BookingRecord): BookingAction[] {
    const actions: BookingAction[] = [];
    const isClient = booking.clientId === actor.userId;
    const isArtist = actor.artistProfileId !== null && booking.artistId === actor.artistProfileId;
    const isAgency = actor.agencyId !== null && booking.agencyId === actor.agencyId;
    const isAdmin = this.isAdminRole(actor.role);

    if (booking.status === PrismaBookingStatus.PENDING && (isArtist || isAgency || isAdmin)) {
      actions.push('confirm');
    }
    if (
      cancellableBookingStatuses.includes(booking.status) &&
      booking.paymentStatus !== PaymentStatus.PAID &&
      (isClient || isArtist || isAgency || isAdmin)
    ) {
      actions.push('cancel');
    }
    if (booking.status === PrismaBookingStatus.IN_PROGRESS && (isArtist || isAgency || isAdmin)) {
      actions.push('complete');
    }
    if (booking.status === PrismaBookingStatus.AWAITING_CLIENT_APPROVAL && (isClient || isAdmin)) {
      actions.push('approve_completion');
    }
    if (
      booking.status !== PrismaBookingStatus.DISPUTED &&
      disputableBookingStatuses.includes(booking.status) &&
      (isClient || isArtist || isAgency || isAdmin)
    ) {
      const disputeWindowOpen = !booking.disputeWindowEndsAt || booking.disputeWindowEndsAt.getTime() >= Date.now();
      if (!disputeWindowStatuses.includes(booking.status) || disputeWindowOpen || isAdmin) {
        actions.push('dispute');
      }
    }

    return actions;
  }

  private normalizeMetadata(value: Prisma.JsonValue | null): Record<string, unknown> | null {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private isAdminRole(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUB_ADMIN;
  }

  generateVerificationCode(length: number): string {
    const normalizedLength = Math.max(4, Math.min(length, 12));
    const digits = '0123456789';
    const bytes = randomBytes(normalizedLength);
    let code = '';

    for (let index = 0; index < normalizedLength; index += 1) {
      code += digits[bytes[index] % digits.length];
    }

    return code;
  }

  encryptVerificationCode(code: string): string {
    const key = createHash('sha256').update(this.getVerificationSecret()).digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(code, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}.${tag.toString('hex')}.${encrypted.toString('hex')}`;
  }

  private decryptVerificationCode(payload: string): string {
    const [ivHex, tagHex, encryptedHex] = payload.split('.');
    if (!ivHex || !tagHex || !encryptedHex) {
      throw new BadRequestException('Stored booking verification code is invalid');
    }
    const key = createHash('sha256').update(this.getVerificationSecret()).digest();
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  }

  private getVerificationSecret(): string {
    const secret = process.env.BOOKING_START_CODE_SECRET?.trim() || process.env.AUTH_TOKEN_SECRET?.trim();
    if (secret) {
      return secret;
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BOOKING_START_CODE_SECRET or AUTH_TOKEN_SECRET must be configured');
    }
    return 'dev-booking-start-code-secret-change-me';
  }
}
