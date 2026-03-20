import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ArtistApplicationStatus, NotificationType, Prisma, UserRole } from '@prisma/client';
import type { AdminDashboardData, AdminSupportThreadItem, PlatformSettings } from '@vendorapp/shared';
import { ArtistTierService } from '../artists/artist-tier.service';
import { MailerService } from '../mailer/mailer.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlatformConfigService } from '../platform/platform-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateArtistApplicationDto } from './dto/update-artist-application.dto';
import { UpdateArtistTierDefinitionDto } from './dto/update-artist-tier-definition.dto';
import { UpdateArtistTierDto } from './dto/update-artist-tier.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformConfigService: PlatformConfigService,
    private readonly artistTierService: ArtistTierService,
    private readonly notificationsService: NotificationsService,
    private readonly mailerService: MailerService,
  ) {}

  async getDashboard(userId: string): Promise<AdminDashboardData> {
    await this.assertAdmin(userId);

    const [settings, artists, supportThreads, manualReviewBookings, tierDefinitions, tierRows] = await Promise.all([
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
    ]);

    const participantIds = Array.from(new Set(supportThreads.flatMap((thread) => [
      ...thread.participantIds,
      ...(thread.assignedAdminUserId ? [thread.assignedAdminUserId] : []),
    ])));
    const users = await this.prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true, fullName: true, role: true },
    });
    const userMap = new Map(users.map((user) => [user.id, user]));

    const mappedSupportThreads: AdminSupportThreadItem[] = supportThreads.map((thread) => {
      const requester = thread.participantIds
        .map((participantId) => userMap.get(participantId))
        .find((participant) => participant && participant.role !== UserRole.ADMIN && participant.role !== UserRole.SUB_ADMIN);
      const assignedAdmin = thread.assignedAdminUserId ? userMap.get(thread.assignedAdminUserId) : null;

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
    });

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
          applicationSubmittedAt: artist.applicationSubmittedAt?.toISOString() ?? null,
          applicationReviewedAt: artist.applicationReviewedAt?.toISOString() ?? null,
          applicationReviewNotes: artist.applicationReviewNotes,
          approvedAt: artist.approvedAt?.toISOString() ?? null,
          isLive: artist.isLive,
          wentLiveAt: artist.wentLiveAt?.toISOString() ?? null,
          firstBookingOnboardingDeductionApplied: artist.firstBookingOnboardingDeductionApplied,
          normalCommissionRate: Number(artist.normalCommissionRate.toString()),
          temporaryFirstBookingCommissionRate: Number(artist.temporaryFirstBookingCommissionRate.toString()),
        })),
        liveSlotsUsed: artists.filter((artist) => artist.isLive).length,
        liveSlotLimit: settings.liveArtistSlotLimit,
        prelaunchPoolCount: artists.filter((artist) => artist.applicationStatus === ArtistApplicationStatus.PRELAUNCH_POOL).length,
        waitlistCount: artists.filter((artist) => artist.applicationStatus === ArtistApplicationStatus.WAITLISTED).length,
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
        estimatedPayoutReleaseAt: booking.estimatedPayoutReleaseAt?.toISOString() ?? null,
        artistName: booking.artist.displayName,
        clientName: booking.client.fullName,
      })),
      tierDefinitions,
      tierRows,
    };
  }

  async updateSettings(userId: string, input: UpdatePlatformSettingsDto): Promise<PlatformSettings> {
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
      const liveCount = await this.prisma.artist.count({ where: { isLive: true } });
      if (liveCount >= settings.liveArtistSlotLimit) {
        throw new BadRequestException('Live artist slot limit reached. Increase the limit or free a slot first.');
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
      const notifications = await this.notificationsService.createMany(this.prisma, [
        {
          userId: updated.userId,
          type: NotificationType.ARTIST_APPLICATION_UPDATED,
          title: 'Artist application updated',
          body:
            input.action === 'go_live'
              ? 'Your artist profile is now live on VendorApp.'
              : `Your artist application was updated to ${updated.applicationStatus.toLowerCase().replace(/_/g, ' ')}.`,
          metadata: {
            artistId: updated.id,
            status: updated.applicationStatus,
          },
        },
      ]);
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

  async updateArtistTier(userId: string, artistId: string, input: UpdateArtistTierDto) {
    await this.assertAdmin(userId);
    await this.artistTierService.setManualTier(artistId, input.tierId ?? null, input.reason ?? null);
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
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUB_ADMIN)) {
      throw new ForbiddenException('Admin access required');
    }
    return user;
  }
}
