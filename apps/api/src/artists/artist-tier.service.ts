import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, BookingVerificationStatus, PaymentStatus, Prisma } from '@prisma/client';
import type {
  ArtistTierAdminRow,
  ArtistTierBenefits,
  ArtistTierDefinition as SharedArtistTierDefinition,
  ArtistTierMetrics,
  ArtistTierProgress,
  ArtistTierThresholds,
} from '@vendorapp/shared';
import { PrismaService } from '../prisma/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

type DefinitionRecord = Prisma.ArtistTierDefinitionGetPayload<{
  select: {
    id: true;
    key: true;
    name: true;
    description: true;
    sortOrder: true;
    isActive: true;
    thresholds: true;
    benefits: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

const defaultTierDefinitions: Array<{
  key: string;
  name: string;
  description: string;
  sortOrder: number;
  thresholds: ArtistTierThresholds;
  benefits: ArtistTierBenefits;
}> = [
  {
    key: 'tier_1',
    name: 'Tier 1',
    description: 'Initial launch tier. Placeholder thresholds should be tuned by admins before wider rollout.',
    sortOrder: 1,
    thresholds: {
      completedPlatformBookings: 0,
      minProfileCompleteness: 40,
    },
    benefits: {
      visibilityBoost: 1,
      recommendedBoost: 1,
      payoutDelayDays: 7,
      badgeLabel: 'Tier 1',
      trustIndicator: 'Emerging',
      accessToSpecialOpportunities: false,
    },
  },
  {
    key: 'tier_2',
    name: 'Tier 2',
    description: 'Placeholder mid-tier for dependable artists. Thresholds are configurable in admin.',
    sortOrder: 2,
    thresholds: {
      completedPlatformBookings: 10,
      platformRevenue: 25000,
      averageRating: 4.4,
      minProfileCompleteness: 70,
      minReliabilityScore: 90,
      maxDisputeRate: 15,
    },
    benefits: {
      visibilityBoost: 1.08,
      recommendedBoost: 1.1,
      payoutDelayDays: 5,
      badgeLabel: 'Tier 2',
      trustIndicator: 'Established',
      accessToSpecialOpportunities: false,
    },
  },
  {
    key: 'tier_3',
    name: 'Tier 3',
    description: 'Placeholder high-performance tier. Tune before launch waves expand.',
    sortOrder: 3,
    thresholds: {
      completedPlatformBookings: 25,
      platformRevenue: 75000,
      averageRating: 4.6,
      minProfileCompleteness: 85,
      minReliabilityScore: 94,
      maxDisputeRate: 10,
      minRepeatBookings: 3,
    },
    benefits: {
      visibilityBoost: 1.16,
      recommendedBoost: 1.2,
      payoutDelayDays: 3,
      badgeLabel: 'Tier 3',
      trustIndicator: 'Trusted',
      accessToSpecialOpportunities: true,
    },
  },
  {
    key: 'tier_4',
    name: 'Tier 4',
    description: 'Placeholder top tier for launch-era routing and payout rewards.',
    sortOrder: 4,
    thresholds: {
      completedPlatformBookings: 60,
      platformRevenue: 180000,
      averageRating: 4.8,
      minProfileCompleteness: 95,
      minReliabilityScore: 97,
      maxDisputeRate: 6,
      minRepeatBookings: 8,
      maxResponseTimeMinutes: 240,
    },
    benefits: {
      visibilityBoost: 1.28,
      recommendedBoost: 1.35,
      payoutDelayDays: 2,
      badgeLabel: 'Tier 4',
      trustIndicator: 'Priority',
      accessToSpecialOpportunities: true,
    },
  },
];

@Injectable()
export class ArtistTierService {
  constructor(private readonly prisma: PrismaService) {}

  async listDefinitions(db: DbClient = this.prisma): Promise<SharedArtistTierDefinition[]> {
    await this.ensureDefaults(db);
    const records = await db.artistTierDefinition.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        sortOrder: true,
        isActive: true,
        thresholds: true,
        benefits: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return records.map((record) => this.toDefinition(record));
  }

  async refreshArtistTier(
    artistId: string,
    db: DbClient = this.prisma,
  ): Promise<ArtistTierProgress> {
    await this.ensureDefaults(db);

    const artist = await db.artist.findUnique({
      where: { id: artistId },
      select: {
        id: true,
        slug: true,
        displayName: true,
        userId: true,
        averageRating: true,
        bio: true,
        role: true,
        location: true,
        services: true,
        specialties: true,
        pricingSummary: true,
        availabilitySummary: true,
        portfolioLinks: true,
        portfolioImages: true,
        tierSnapshot: {
          select: {
            id: true,
            manualTierId: true,
            manualOverrideReason: true,
          },
        },
      },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    const definitions = await this.listDefinitions(db);
    const metrics = await this.buildMetrics(
      artist.id,
      artist.userId,
      artist.averageRating,
      {
        bio: artist.bio,
        role: artist.role,
        location: artist.location,
        services: artist.services,
        specialties: artist.specialties,
        pricingSummary: artist.pricingSummary,
        availabilitySummary: artist.availabilitySummary,
        portfolioLinks: artist.portfolioLinks,
        portfolioImages: artist.portfolioImages,
      },
      db,
    );

    const evaluatedTier = this.resolveEvaluatedTier(definitions, metrics);
    const manualTier =
      artist.tierSnapshot?.manualTierId
        ? definitions.find((definition) => definition.id === artist.tierSnapshot?.manualTierId) ?? null
        : null;
    const currentTier = manualTier ?? evaluatedTier;
    const nextTier = this.getNextTier(definitions, currentTier?.sortOrder ?? 0);
    const progressPercent = this.calculateProgressPercent(nextTier, metrics);
    const reasons = nextTier ? this.getUnmetThresholdReasons(nextTier.thresholds, metrics) : [];
    const now = new Date();

    await db.artistTierSnapshot.upsert({
      where: { artistId: artist.id },
      update: {
        currentTierId: currentTier?.id ?? null,
        evaluatedTierId: evaluatedTier?.id ?? null,
        completedPlatformBookings: metrics.completedPlatformBookings,
        verifiedPlatformBookings: metrics.verifiedPlatformBookings,
        platformRevenue: metrics.platformRevenue.toFixed(2),
        averageRating: metrics.averageRating,
        cancellationCount: metrics.cancellationCount,
        reliabilityScore: metrics.reliabilityScore,
        responseTimeMinutes: metrics.responseTimeMinutes ?? null,
        disputeCount: metrics.disputeCount,
        disputeRate: metrics.disputeRate,
        profileCompleteness: metrics.profileCompleteness,
        repeatBookings: metrics.repeatBookings,
        evaluationDetails: {
          reasons,
          nextTierId: nextTier?.id ?? null,
          nextTierKey: nextTier?.key ?? null,
        },
        lastEvaluatedAt: now,
      },
      create: {
        artistId: artist.id,
        currentTierId: currentTier?.id ?? null,
        evaluatedTierId: evaluatedTier?.id ?? null,
        manualTierId: artist.tierSnapshot?.manualTierId ?? null,
        manualOverrideReason: artist.tierSnapshot?.manualOverrideReason ?? null,
        completedPlatformBookings: metrics.completedPlatformBookings,
        verifiedPlatformBookings: metrics.verifiedPlatformBookings,
        platformRevenue: metrics.platformRevenue.toFixed(2),
        averageRating: metrics.averageRating,
        cancellationCount: metrics.cancellationCount,
        reliabilityScore: metrics.reliabilityScore,
        responseTimeMinutes: metrics.responseTimeMinutes ?? null,
        disputeCount: metrics.disputeCount,
        disputeRate: metrics.disputeRate,
        profileCompleteness: metrics.profileCompleteness,
        repeatBookings: metrics.repeatBookings,
        evaluationDetails: {
          reasons,
          nextTierId: nextTier?.id ?? null,
          nextTierKey: nextTier?.key ?? null,
        },
        lastEvaluatedAt: now,
      },
    });

    return {
      currentTier,
      evaluatedTier,
      manualTier,
      nextTier,
      progressPercent,
      metrics,
      reasons,
      lastEvaluatedAt: now.toISOString(),
    };
  }

  async setManualTier(
    artistId: string,
    manualTierId: string | null,
    reason: string | null,
    db: DbClient = this.prisma,
  ): Promise<ArtistTierProgress> {
    await db.artistTierSnapshot.upsert({
      where: { artistId },
      update: {
        manualTierId,
        manualOverrideReason: reason,
      },
      create: {
        artistId,
        manualTierId,
        manualOverrideReason: reason,
      },
    });

    return this.refreshArtistTier(artistId, db);
  }

  async updateDefinition(
    tierId: string,
    input: {
      name?: string;
      description?: string | null;
      sortOrder?: number;
      isActive?: boolean;
      thresholds?: ArtistTierThresholds;
      benefits?: ArtistTierBenefits;
    },
    db: DbClient = this.prisma,
  ): Promise<SharedArtistTierDefinition> {
    const updated = await db.artistTierDefinition.update({
      where: { id: tierId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.thresholds !== undefined ? { thresholds: input.thresholds as Prisma.InputJsonValue } : {}),
        ...(input.benefits !== undefined ? { benefits: input.benefits as Prisma.InputJsonValue } : {}),
      },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        sortOrder: true,
        isActive: true,
        thresholds: true,
        benefits: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.toDefinition(updated);
  }

  async listArtistRows(db: DbClient = this.prisma): Promise<ArtistTierAdminRow[]> {
    const artists = await db.artist.findMany({
      orderBy: [{ createdAt: 'asc' }],
      select: {
        id: true,
        slug: true,
        displayName: true,
        applicationStatus: true,
      },
    });

    const rows: ArtistTierAdminRow[] = [];
    for (const artist of artists) {
      const progress = await this.refreshArtistTier(artist.id, db);
      rows.push({
        artistId: artist.id,
        artistName: artist.displayName,
        artistSlug: artist.slug,
        applicationStatus: artist.applicationStatus,
        currentTier: progress.currentTier ?? null,
        evaluatedTier: progress.evaluatedTier ?? null,
        manualTier: progress.manualTier ?? null,
        progress,
      });
    }

    return rows;
  }

  private async ensureDefaults(db: DbClient): Promise<void> {
    const count = await db.artistTierDefinition.count();
    if (count > 0) {
      return;
    }

    for (const definition of defaultTierDefinitions) {
      await db.artistTierDefinition.create({
        data: {
          key: definition.key,
          name: definition.name,
          description: definition.description,
          sortOrder: definition.sortOrder,
          isActive: true,
          thresholds: definition.thresholds as Prisma.InputJsonValue,
          benefits: definition.benefits as Prisma.InputJsonValue,
        },
      });
    }
  }

  private async buildMetrics(
    artistId: string,
    artistUserId: string | null,
    averageRating: number,
    profile: {
      bio: string;
      role: string;
      location: string;
      services: string[];
      specialties: string[];
      pricingSummary: string | null;
      availabilitySummary: string | null;
      portfolioLinks: string[];
      portfolioImages: string[];
    },
    db: DbClient,
  ): Promise<ArtistTierMetrics> {
    const verifiedCompletedWhere: Prisma.BookingWhereInput = {
      artistId,
      paymentStatus: PaymentStatus.PAID,
      verificationStatus: {
        in: [BookingVerificationStatus.VERIFIED, BookingVerificationStatus.MANUAL_OVERRIDE],
      },
      status: {
        in: [
          BookingStatus.COMPLETED,
          BookingStatus.PAYOUT_PENDING,
          BookingStatus.PAYOUT_RELEASED,
        ],
      },
    };

    const [verifiedCount, revenueAggregate, totalBookings, cancellationCount, disputeCount, repeatGroups, responseTimeMinutes] =
      await Promise.all([
        db.booking.count({ where: verifiedCompletedWhere }),
        db.booking.aggregate({
          where: verifiedCompletedWhere,
          _sum: {
            totalAmount: true,
          },
        }),
        db.booking.count({ where: { artistId } }),
        db.booking.count({
          where: {
            artistId,
            status: BookingStatus.CANCELLED,
          },
        }),
        db.booking.count({
          where: {
            artistId,
            OR: [{ status: BookingStatus.DISPUTED }, { disputeOpenedAt: { not: null } }],
          },
        }),
        db.booking.groupBy({
          by: ['clientId'],
          where: verifiedCompletedWhere,
          _count: {
            clientId: true,
          },
        }),
        this.computeAverageResponseTimeMinutes(artistId, artistUserId, db),
      ]);

    const repeatBookings = repeatGroups.filter((entry) => entry._count.clientId >= 2).length;
    const revenue = Number(revenueAggregate._sum.totalAmount?.toString() ?? '0');
    const reliabilityScore = totalBookings === 0 ? 100 : Number((100 - (cancellationCount / totalBookings) * 100).toFixed(2));
    const disputeRate = verifiedCount === 0 ? 0 : Number(((disputeCount / verifiedCount) * 100).toFixed(2));

    return {
      completedPlatformBookings: verifiedCount,
      verifiedPlatformBookings: verifiedCount,
      platformRevenue: revenue,
      averageRating,
      cancellationCount,
      reliabilityScore,
      responseTimeMinutes,
      disputeCount,
      disputeRate,
      profileCompleteness: this.computeProfileCompleteness(profile),
      repeatBookings,
    };
  }

  private async computeAverageResponseTimeMinutes(
    artistId: string,
    artistUserId: string | null,
    db: DbClient,
  ): Promise<number | null> {
    if (!artistUserId) {
      return null;
    }

    const conversations = await db.conversation.findMany({
      where: {
        kind: 'BOOKING',
        booking: {
          is: {
            artistId,
          },
        },
      },
      select: {
        booking: {
          select: {
            clientId: true,
          },
        },
        messages: {
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          select: {
            senderId: true,
            createdAt: true,
          },
        },
      },
    });

    const deltas: number[] = [];
    for (const conversation of conversations) {
      const clientId = conversation.booking?.clientId;
      if (!clientId) {
        continue;
      }

      let firstClientMessageAt: Date | null = null;
      let artistReplyAt: Date | null = null;

      for (const message of conversation.messages) {
        if (!firstClientMessageAt && message.senderId === clientId) {
          firstClientMessageAt = message.createdAt;
          continue;
        }

        if (firstClientMessageAt && message.senderId === artistUserId) {
          artistReplyAt = message.createdAt;
          break;
        }
      }

      if (firstClientMessageAt && artistReplyAt) {
        const diffMinutes = Math.max(
          0,
          Math.round((artistReplyAt.getTime() - firstClientMessageAt.getTime()) / 60000),
        );
        deltas.push(diffMinutes);
      }
    }

    if (deltas.length === 0) {
      return null;
    }

    return Math.round(deltas.reduce((sum, value) => sum + value, 0) / deltas.length);
  }

  private computeProfileCompleteness(profile: {
    bio: string;
    role: string;
    location: string;
    services: string[];
    specialties: string[];
    pricingSummary: string | null;
    availabilitySummary: string | null;
    portfolioLinks: string[];
    portfolioImages: string[];
  }): number {
    const checks = [
      profile.bio.trim().length >= 20,
      profile.role.trim().length >= 2,
      profile.location.trim().length >= 2,
      profile.services.length > 0,
      profile.specialties.length > 0,
      Boolean(profile.pricingSummary?.trim()),
      Boolean(profile.availabilitySummary?.trim()),
      profile.portfolioLinks.length > 0 || profile.portfolioImages.length > 0,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  private resolveEvaluatedTier(
    definitions: SharedArtistTierDefinition[],
    metrics: ArtistTierMetrics,
  ): SharedArtistTierDefinition | null {
    const activeDefinitions = definitions.filter((definition) => definition.isActive);
    let current: SharedArtistTierDefinition | null = null;
    for (const definition of activeDefinitions) {
      if (this.meetsThresholds(definition.thresholds, metrics)) {
        current = definition;
      }
    }
    return current;
  }

  private getNextTier(
    definitions: SharedArtistTierDefinition[],
    currentSortOrder: number,
  ): SharedArtistTierDefinition | null {
    return (
      definitions.find(
        (definition) => definition.isActive && definition.sortOrder > currentSortOrder,
      ) ?? null
    );
  }

  private calculateProgressPercent(
    nextTier: SharedArtistTierDefinition | null,
    metrics: ArtistTierMetrics,
  ): number {
    if (!nextTier) {
      return 100;
    }

    const ratios = this.getThresholdRatios(nextTier.thresholds, metrics);
    if (ratios.length === 0) {
      return 100;
    }

    return Math.round(
      (ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length) * 100,
    );
  }

  private getThresholdRatios(
    thresholds: ArtistTierThresholds,
    metrics: ArtistTierMetrics,
  ): number[] {
    const ratios: number[] = [];

    if (thresholds.completedPlatformBookings !== undefined) {
      ratios.push(this.safeRatio(metrics.completedPlatformBookings, thresholds.completedPlatformBookings));
    }
    if (thresholds.verifiedPlatformBookings !== undefined) {
      ratios.push(this.safeRatio(metrics.verifiedPlatformBookings, thresholds.verifiedPlatformBookings));
    }
    if (thresholds.platformRevenue !== undefined) {
      ratios.push(this.safeRatio(metrics.platformRevenue, thresholds.platformRevenue));
    }
    if (thresholds.averageRating !== undefined) {
      ratios.push(this.safeRatio(metrics.averageRating, thresholds.averageRating));
    }
    if (thresholds.minReliabilityScore !== undefined) {
      ratios.push(this.safeRatio(metrics.reliabilityScore, thresholds.minReliabilityScore));
    }
    if (thresholds.maxDisputeRate !== undefined) {
      ratios.push(metrics.disputeRate <= thresholds.maxDisputeRate ? 1 : thresholds.maxDisputeRate / Math.max(metrics.disputeRate, 1));
    }
    if (thresholds.minProfileCompleteness !== undefined) {
      ratios.push(this.safeRatio(metrics.profileCompleteness, thresholds.minProfileCompleteness));
    }
    if (thresholds.minRepeatBookings !== undefined) {
      ratios.push(this.safeRatio(metrics.repeatBookings, thresholds.minRepeatBookings));
    }
    if (thresholds.maxResponseTimeMinutes !== undefined) {
      if (metrics.responseTimeMinutes === null || metrics.responseTimeMinutes === undefined) {
        ratios.push(0);
      } else {
        ratios.push(
          metrics.responseTimeMinutes <= thresholds.maxResponseTimeMinutes
            ? 1
            : thresholds.maxResponseTimeMinutes / Math.max(metrics.responseTimeMinutes, 1),
        );
      }
    }

    return ratios.map((ratio) => Math.max(0, Math.min(1, ratio)));
  }

  private meetsThresholds(thresholds: ArtistTierThresholds, metrics: ArtistTierMetrics): boolean {
    return this.getUnmetThresholdReasons(thresholds, metrics).length === 0;
  }

  private getUnmetThresholdReasons(
    thresholds: ArtistTierThresholds,
    metrics: ArtistTierMetrics,
  ): string[] {
    const reasons: string[] = [];

    if (
      thresholds.completedPlatformBookings !== undefined &&
      metrics.completedPlatformBookings < thresholds.completedPlatformBookings
    ) {
      reasons.push(`Complete ${thresholds.completedPlatformBookings} verified platform bookings.`);
    }
    if (
      thresholds.verifiedPlatformBookings !== undefined &&
      metrics.verifiedPlatformBookings < thresholds.verifiedPlatformBookings
    ) {
      reasons.push(`Reach ${thresholds.verifiedPlatformBookings} verified bookings.`);
    }
    if (
      thresholds.platformRevenue !== undefined &&
      metrics.platformRevenue < thresholds.platformRevenue
    ) {
      reasons.push(`Generate ${thresholds.platformRevenue.toFixed(0)} in platform revenue.`);
    }
    if (thresholds.averageRating !== undefined && metrics.averageRating < thresholds.averageRating) {
      reasons.push(`Maintain an average rating of ${thresholds.averageRating.toFixed(1)} or higher.`);
    }
    if (
      thresholds.minReliabilityScore !== undefined &&
      metrics.reliabilityScore < thresholds.minReliabilityScore
    ) {
      reasons.push(`Keep reliability at ${thresholds.minReliabilityScore.toFixed(0)}% or higher.`);
    }
    if (thresholds.maxDisputeRate !== undefined && metrics.disputeRate > thresholds.maxDisputeRate) {
      reasons.push(`Reduce dispute rate below ${thresholds.maxDisputeRate.toFixed(1)}%.`);
    }
    if (
      thresholds.minProfileCompleteness !== undefined &&
      metrics.profileCompleteness < thresholds.minProfileCompleteness
    ) {
      reasons.push(`Raise profile completeness to ${thresholds.minProfileCompleteness}% or higher.`);
    }
    if (
      thresholds.minRepeatBookings !== undefined &&
      metrics.repeatBookings < thresholds.minRepeatBookings
    ) {
      reasons.push(`Secure ${thresholds.minRepeatBookings} repeat-booking clients.`);
    }
    if (
      thresholds.maxResponseTimeMinutes !== undefined &&
      (metrics.responseTimeMinutes === null ||
        metrics.responseTimeMinutes === undefined ||
        metrics.responseTimeMinutes > thresholds.maxResponseTimeMinutes)
    ) {
      reasons.push(`Respond within ${thresholds.maxResponseTimeMinutes} minutes on average.`);
    }

    return reasons;
  }

  private safeRatio(value: number, target: number): number {
    if (target <= 0) {
      return 1;
    }
    return value / target;
  }

  private toDefinition(record: DefinitionRecord): SharedArtistTierDefinition {
    return {
      id: record.id,
      key: record.key,
      name: record.name,
      description: record.description,
      sortOrder: record.sortOrder,
      isActive: record.isActive,
      thresholds: this.normalizeObject<ArtistTierThresholds>(record.thresholds),
      benefits: this.normalizeObject<ArtistTierBenefits>(record.benefits),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private normalizeObject<T extends object>(value: Prisma.JsonValue | null): T {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return {} as T;
    }
    return value as T;
  }
}
