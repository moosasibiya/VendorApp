import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ArtistApplicationStatus,
  NotificationType,
  PrelaunchInsiderStatus,
  UserRole,
} from '@prisma/client';
import type {
  AdminDashboardData,
  AdminInsiderItem,
  AdminSupportThreadItem,
  PlatformSettings,
} from '@vendorapp/shared';
import { ArtistTierService } from '../artists/artist-tier.service';
import { MailerService } from '../mailer/mailer.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformConfigService } from '../platform/platform-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateArtistApplicationDto } from './dto/update-artist-application.dto';
import { UpdateArtistTierDefinitionDto } from './dto/update-artist-tier-definition.dto';
import { UpdateArtistTierDto } from './dto/update-artist-tier.dto';
import { UpdateInsiderDto } from './dto/update-insider.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly platformConfigService: PlatformConfigService,
    private readonly artistTierService: ArtistTierService,
    private readonly notificationsService: NotificationsService,
    private readonly mailerService: MailerService,
  ) {}

  async getDashboard(userId: string): Promise<AdminDashboardData> {
    await this.assertAdmin(userId);

    const [
      settings,
      artists,
      supportThreads,
      manualReviewBookings,
      tierDefinitions,
      tierRows,
      insiders,
    ] = await Promise.all([
      this.platformConfigService.getSettings(),
      this.prisma.artist.findMany({
        orderBy: [{ applicationSubmittedAt: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          userId: true,
          displayName: true,
          slug: true,
          location: true,
          role: true,
          applicationStatus: true,
          applicationSequence: true,
          applicationSubmittedAt: true,
          applicationReviewedAt: true,
          applicationReviewNotes: true,
          approvedAt: true,
          isLive: true,
          wentLiveAt: true,
          firstBookingOnboardingDeductionApplied: true,
          normalCommissionRate: true,
          temporaryFirstBookingCommissionRate: true,
        },
      }),
      this.prisma.conversation.findMany({
        where: { kind: 'SUPPORT' },
        orderBy: [{ lastMessageAt: 'desc' }],
        take: 50,
        select: {
          id: true,
          supportTicketNumber: true,
          subject: true,
          supportStatus: true,
          supportCategory: true,
          bookingId: true,
          participantIds: true,
          assignedAdminUserId: true,
          lastMessageAt: true,
          createdAt: true,
        },
      }),
      this.prisma.booking.findMany({
        where: {
          OR: [
            { payoutStatus: { in: ['MANUAL_REVIEW', 'ON_HOLD'] } },
            { status: 'DISPUTED' },
          ],
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 50,
        select: {
          id: true,
          title: true,
          status: true,
          payoutStatus: true,
          verificationStatus: true,
          payoutHoldReason: true,
          disputeWindowEndsAt: true,
          estimatedPayoutReleaseAt: true,
          client: { select: { fullName: true } },
          artist: { select: { displayName: true } },
        },
      }),
      this.artistTierService.listDefinitions(),
      this.artistTierService.listArtistRows(),
      this.prisma.prelaunchLead.findMany({
        orderBy: [{ createdAt: 'desc' }],
        take: 500,
      }),
    ]);

    const participantIdSet = new Set<string>();
    for (const thread of supportThreads) {
      for (const participantId of thread.participantIds) {
        if (typeof participantId === 'string') {
          participantIdSet.add(participantId);
        }
      }
      if (thread.assignedAdminUserId) {
        participantIdSet.add(thread.assignedAdminUserId);
      }
    }
    const participantIds: string[] = Array.from(participantIdSet);
    const users = await this.prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true, fullName: true, role: true },
    });
    const userMap = new Map(users.map((user) => [user.id, user]));

    const mappedSupportThreads: AdminSupportThreadItem[] = supportThreads.map(
      (thread) => {
        const requester = thread.participantIds
          .map((participantId) => userMap.get(participantId))
          .find(
            (participant) =>
              participant &&
              participant.role !== UserRole.ADMIN &&
              participant.role !== UserRole.SUB_ADMIN,
          );
        const assignedAdmin = thread.assignedAdminUserId
          ? userMap.get(thread.assignedAdminUserId)
          : null;

        return {
          conversationId: thread.id,
          ticketNumber: thread.supportTicketNumber,
          subject: thread.subject,
          status: thread.supportStatus,
          category: thread.supportCategory,
          bookingId: thread.bookingId,
          requesterName: requester?.fullName ?? 'Support requester',
          assignedAdminName: assignedAdmin?.fullName ?? null,
          lastMessageAt: thread.lastMessageAt.toISOString(),
          createdAt: thread.createdAt.toISOString(),
        };
      },
    );

    return {
      settings,
      artistApplications: {
        items: artists.map((artist) => ({
          artistId: artist.id,
          userId: artist.userId,
          displayName: artist.displayName,
          slug: artist.slug,
          location: artist.location,
          role: artist.role,
          applicationStatus: artist.applicationStatus,
          applicationSequence: artist.applicationSequence,
          applicationSubmittedAt:
            artist.applicationSubmittedAt?.toISOString() ?? null,
          applicationReviewedAt:
            artist.applicationReviewedAt?.toISOString() ?? null,
          applicationReviewNotes: artist.applicationReviewNotes,
          approvedAt: artist.approvedAt?.toISOString() ?? null,
          isLive: artist.isLive,
          wentLiveAt: artist.wentLiveAt?.toISOString() ?? null,
          firstBookingOnboardingDeductionApplied:
            artist.firstBookingOnboardingDeductionApplied,
          normalCommissionRate: Number(artist.normalCommissionRate.toString()),
          temporaryFirstBookingCommissionRate: Number(
            artist.temporaryFirstBookingCommissionRate.toString(),
          ),
        })),
        liveSlotsUsed: artists.filter((artist) => artist.isLive).length,
        liveSlotLimit: settings.liveArtistSlotLimit,
        prelaunchPoolCount: artists.filter(
          (artist) =>
            artist.applicationStatus === ArtistApplicationStatus.PRELAUNCH_POOL,
        ).length,
        waitlistCount: artists.filter(
          (artist) =>
            artist.applicationStatus === ArtistApplicationStatus.WAITLISTED,
        ).length,
      },
      supportThreads: mappedSupportThreads,
      manualReviewBookings: manualReviewBookings.map((booking) => ({
        bookingId: booking.id,
        title: booking.title,
        status: booking.status,
        payoutStatus: booking.payoutStatus,
        verificationStatus: booking.verificationStatus,
        payoutHoldReason: booking.payoutHoldReason,
        disputeWindowEndsAt: booking.disputeWindowEndsAt?.toISOString() ?? null,
        estimatedPayoutReleaseAt:
          booking.estimatedPayoutReleaseAt?.toISOString() ?? null,
        artistName: booking.artist.displayName,
        clientName: booking.client.fullName,
      })),
      insiders: this.mapInsiderSummary(insiders),
      tierDefinitions,
      tierRows,
    };
  }

  async updateInsider(
    userId: string,
    insiderId: string,
    input: UpdateInsiderDto,
  ) {
    const admin = await this.assertAdmin(userId);
    const current = await this.prisma.prelaunchLead.findUnique({
      where: { id: insiderId },
    });
    if (!current) {
      throw new NotFoundException('Insider not found');
    }

    let verifiedNow = false;
    let updated = current;

    if (input.verified === true) {
      const now = new Date();
      const result = await this.prisma.prelaunchLead.updateMany({
        where: {
          id: insiderId,
          insiderStatus: { not: PrelaunchInsiderStatus.VERIFIED },
        },
        data: {
          ...(input.instagramFollowed !== undefined
            ? { instagramFollowed: input.instagramFollowed }
            : { instagramFollowed: true }),
          ...(input.tiktokFollowed !== undefined
            ? { tiktokFollowed: input.tiktokFollowed }
            : { tiktokFollowed: true }),
          insiderStatus: PrelaunchInsiderStatus.VERIFIED,
          verifiedAt: now,
          verifiedBy: admin.id,
        },
      });
      verifiedNow = result.count === 1;
      updated =
        (await this.prisma.prelaunchLead.findUnique({
          where: { id: insiderId },
        })) ?? current;
    } else {
      updated = await this.prisma.prelaunchLead.update({
        where: { id: insiderId },
        data: {
          ...(input.instagramFollowed !== undefined
            ? { instagramFollowed: input.instagramFollowed }
            : {}),
          ...(input.tiktokFollowed !== undefined
            ? { tiktokFollowed: input.tiktokFollowed }
            : {}),
          ...(input.verified === false
            ? {
                insiderStatus: PrelaunchInsiderStatus.PENDING,
                verifiedAt: null,
                verifiedBy: null,
              }
            : {}),
        },
      });
    }

    if (verifiedNow) {
      await this.handleInsiderVerified(updated);
    }

    return this.getDashboard(userId);
  }

  async exportInsidersCsv(userId: string): Promise<string> {
    await this.assertAdmin(userId);
    const insiders = await this.prisma.prelaunchLead.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });
    const rows = [
      [
        'First name',
        'Last name',
        'Email',
        'Phone number',
        'User type',
        'Insider status',
        'Instagram followed',
        'TikTok followed',
        'Referral code',
        'Referred by',
        'Referral count',
        'Created at',
        'Verified at',
      ],
      ...insiders.map((insider) => [
        insider.firstName,
        insider.lastName,
        insider.email,
        insider.phoneNumber,
        insider.userType,
        insider.insiderStatus,
        String(insider.instagramFollowed),
        String(insider.tiktokFollowed),
        insider.referralCode,
        insider.referredBy ?? '',
        String(insider.referralCount),
        insider.createdAt.toISOString(),
        insider.verifiedAt?.toISOString() ?? '',
      ]),
    ];

    return rows
      .map((row) => row.map((value) => this.csvEscape(value)).join(','))
      .join('\n');
  }

  async updateSettings(
    userId: string,
    input: UpdatePlatformSettingsDto,
  ): Promise<PlatformSettings> {
    await this.assertAdmin(userId);
    return this.platformConfigService.updateSettings(userId, input);
  }

  async updateArtistApplication(
    userId: string,
    artistId: string,
    input: UpdateArtistApplicationDto,
  ) {
    const admin = await this.assertAdmin(userId);
    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId },
      select: {
        id: true,
        userId: true,
        displayName: true,
        applicationStatus: true,
        approvedAt: true,
        isLive: true,
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
    });
    if (!artist) {
      throw new NotFoundException('Artist application not found');
    }

    const note = input.note?.trim() || null;
    const now = new Date();
    const settings = await this.platformConfigService.getSettings();

    if (input.action === 'go_live' && !artist.isLive) {
      const liveCount = await this.prisma.artist.count({
        where: { isLive: true },
      });
      if (liveCount >= settings.liveArtistSlotLimit) {
        throw new BadRequestException(
          'Live artist slot limit reached. Increase the limit or free a slot first.',
        );
      }
    }

    const updated = await this.prisma.artist.update({
      where: { id: artist.id },
      data:
        input.action === 'under_review'
          ? {
              applicationStatus: ArtistApplicationStatus.UNDER_REVIEW,
              applicationReviewedAt: now,
              applicationReviewedByUserId: admin.id,
              applicationReviewNotes: note,
            }
          : input.action === 'approve'
            ? {
                applicationStatus: ArtistApplicationStatus.APPROVED,
                applicationReviewedAt: now,
                applicationReviewedByUserId: admin.id,
                applicationReviewNotes: note,
                approvedAt: artist.approvedAt ?? now,
                approvedByUserId: admin.id,
              }
            : input.action === 'reject'
              ? {
                  applicationStatus: ArtistApplicationStatus.REJECTED,
                  applicationReviewedAt: now,
                  applicationReviewedByUserId: admin.id,
                  applicationReviewNotes: note,
                  isLive: false,
                }
              : {
                  applicationStatus: ArtistApplicationStatus.LIVE,
                  applicationReviewedAt: now,
                  applicationReviewedByUserId: admin.id,
                  applicationReviewNotes: note,
                  approvedAt: artist.approvedAt ?? now,
                  approvedByUserId: admin.id,
                  isLive: true,
                  wentLiveAt: now,
                  liveEnabledByUserId: admin.id,
                  isVerified: true,
                },
      select: {
        id: true,
        userId: true,
        displayName: true,
        applicationStatus: true,
        isLive: true,
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (updated.userId) {
      const notifications = await this.notificationsService.createMany(
        this.prisma,
        [
          {
            userId: updated.userId,
            type: NotificationType.ARTIST_APPLICATION_UPDATED,
            title: 'Artist application updated',
            body:
              input.action === 'go_live'
                ? 'Your artist profile is now live on Vendr Studios.'
                : `Your artist application was updated to ${updated.applicationStatus.toLowerCase().replace(/_/g, ' ')}.`,
            metadata: {
              artistId: updated.id,
              status: updated.applicationStatus,
            },
          },
        ],
      );
      this.notificationsService.emitMany(notifications);
    }

    if (input.action === 'go_live' && updated.user?.email) {
      await this.mailerService.sendArtistApprovedLive(updated.user.email, {
        recipientName: updated.user.fullName,
        artistName: updated.displayName,
      });
    }

    return this.getDashboard(userId);
  }

  async updateArtistTier(
    userId: string,
    artistId: string,
    input: UpdateArtistTierDto,
  ) {
    await this.assertAdmin(userId);
    await this.artistTierService.setManualTier(
      artistId,
      input.tierId ?? null,
      input.reason ?? null,
    );
    return this.getDashboard(userId);
  }

  async updateTierDefinition(
    userId: string,
    tierId: string,
    input: UpdateArtistTierDefinitionDto,
  ) {
    await this.assertAdmin(userId);
    await this.artistTierService.updateDefinition(tierId, input);
    return this.getDashboard(userId);
  }

  private async assertAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, role: true },
    });
    if (
      !user ||
      (user.role !== UserRole.ADMIN && user.role !== UserRole.SUB_ADMIN)
    ) {
      throw new ForbiddenException('Admin access required');
    }
    return user;
  }

  private mapInsiderSummary(
    insiders: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      userType: 'CLIENT' | 'ARTIST';
      insiderStatus: 'PENDING' | 'VERIFIED';
      instagramFollowed: boolean;
      tiktokFollowed: boolean;
      referralCode: string;
      referredBy: string | null;
      referralCount: number;
      createdAt: Date;
      verifiedAt: Date | null;
    }>,
  ) {
    const items: AdminInsiderItem[] = insiders.map((insider) => ({
      id: insider.id,
      firstName: insider.firstName,
      lastName: insider.lastName,
      email: insider.email,
      phoneNumber: insider.phoneNumber,
      userType: insider.userType,
      insiderStatus: insider.insiderStatus,
      instagramFollowed: insider.instagramFollowed,
      tiktokFollowed: insider.tiktokFollowed,
      referralCode: insider.referralCode,
      referredBy: insider.referredBy,
      referralCount: insider.referralCount,
      createdAt: insider.createdAt.toISOString(),
      verifiedAt: insider.verifiedAt?.toISOString() ?? null,
    }));

    return {
      items,
      leaderboard: [...items]
        .sort((a, b) => b.referralCount - a.referralCount)
        .slice(0, 20),
      total: items.length,
      pending: items.filter((item) => item.insiderStatus === 'PENDING').length,
      verified: items.filter((item) => item.insiderStatus === 'VERIFIED')
        .length,
      clients: items.filter((item) => item.userType === 'CLIENT').length,
      artists: items.filter((item) => item.userType === 'ARTIST').length,
    };
  }

  private async handleInsiderVerified(insider: {
    id: string;
    email: string;
    emailNormalized: string;
    firstName: string;
    userType: 'CLIENT' | 'ARTIST';
    referralCode: string;
    referredBy: string | null;
  }) {
    const inviteLink = `${this.getWebOrigin()}/insider/${encodeURIComponent(insider.referralCode)}`;
    await this.mailerService
      .sendInsiderActivated(insider.email, {
        firstName: insider.firstName,
        userType: insider.userType,
        inviteLink,
      })
      .catch((error: unknown) => {
        this.logger.warn(
          JSON.stringify({
            type: 'insider_activated_email_failed',
            referralCode: insider.referralCode,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        );
      });

    const referredBy = insider.referredBy;
    if (!referredBy) return;
    const referrer = await this.prisma
      .$transaction(async (tx) => {
        const creditResult = await tx.prelaunchLead.updateMany({
          where: {
            id: insider.id,
            referredBy,
            referralCreditedAt: null,
          },
          data: {
            referralCreditedAt: new Date(),
          },
        });
        if (creditResult.count !== 1) {
          return null;
        }

        const referrerResult = await tx.prelaunchLead.updateMany({
          where: {
            referralCode: referredBy,
            emailNormalized: { not: insider.emailNormalized },
          },
          data: { referralCount: { increment: 1 } },
        });
        if (referrerResult.count !== 1) {
          return null;
        }

        return tx.prelaunchLead.findUnique({
          where: { referralCode: referredBy },
        });
      })
      .catch((error: unknown) => {
        this.logger.warn(
          JSON.stringify({
            type: 'referral_credit_failed',
            insiderId: insider.id,
            referredBy,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        );
        return null;
      });
    if (!referrer) return;

    await this.mailerService
      .sendReferralVerified(referrer.email, {
        firstName: referrer.firstName,
        userType: referrer.userType,
        referralCount: referrer.referralCount,
      })
      .catch((error: unknown) => {
        this.logger.warn(
          JSON.stringify({
            type: 'referral_verified_email_failed',
            referrerCode: referrer.referralCode,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        );
      });
  }

  private csvEscape(value: string): string {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private getWebOrigin(): string {
    return (
      process.env.WEB_ORIGIN?.split(',')[0]?.trim() ||
      process.env.NEXT_PUBLIC_WEB_URL?.trim() ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
  }
}
