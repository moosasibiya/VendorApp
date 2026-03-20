import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ArtistApplicationStatus,
  OnboardingFeeModel,
  Prisma,
} from '@prisma/client';
import type {
  ApiResponse,
  Artist,
  ArtistCategory,
  ArtistTierDefinition,
  ArtistTierProgress,
} from '@vendorapp/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformConfigService } from '../platform/platform-config.service';
import { PLATFORM_COUNTER_KEYS } from '../platform/platform-settings';
import type { UpsertArtistProfileDto } from './dto/upsert-artist-profile.dto';
import { ListArtistsQueryDto } from './dto/list-artists-query.dto';
import { ArtistTierService } from './artist-tier.service';

const tierDefinitionSelect = {
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
} satisfies Prisma.ArtistTierDefinitionSelect;

const artistSelect = {
  id: true,
  userId: true,
  displayName: true,
  name: true,
  role: true,
  location: true,
  hourlyRate: true,
  isAvailable: true,
  isVerified: true,
  rating: true,
  bio: true,
  tags: true,
  services: true,
  specialties: true,
  pricingSummary: true,
  availabilitySummary: true,
  portfolioImages: true,
  portfolioLinks: true,
  averageRating: true,
  totalReviews: true,
  profileViews: true,
  slug: true,
  onboardingCompleted: true,
  applicationStatus: true,
  applicationSequence: true,
  applicationSubmittedAt: true,
  applicationReviewedAt: true,
  applicationReviewNotes: true,
  approvedAt: true,
  isLive: true,
  wentLiveAt: true,
  onboardingFeeModel: true,
  firstBookingOnboardingDeductionApplied: true,
  firstBookingOnboardingDeductionAt: true,
  normalCommissionRate: true,
  temporaryFirstBookingCommissionRate: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      iconUrl: true,
    },
  },
  tierSnapshot: {
    select: {
      completedPlatformBookings: true,
      verifiedPlatformBookings: true,
      platformRevenue: true,
      averageRating: true,
      cancellationCount: true,
      reliabilityScore: true,
      responseTimeMinutes: true,
      disputeCount: true,
      disputeRate: true,
      profileCompleteness: true,
      repeatBookings: true,
      evaluationDetails: true,
      lastEvaluatedAt: true,
      currentTier: {
        select: tierDefinitionSelect,
      },
      evaluatedTier: {
        select: tierDefinitionSelect,
      },
      manualTier: {
        select: tierDefinitionSelect,
      },
    },
  },
} satisfies Prisma.ArtistSelect;

type ArtistRecord = Prisma.ArtistGetPayload<{
  select: typeof artistSelect;
}>;

type ArtistTierDefinitionRecord = NonNullable<
  NonNullable<ArtistRecord['tierSnapshot']>['currentTier']
>;

@Injectable()
export class ArtistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformConfigService: PlatformConfigService,
    private readonly artistTierService: ArtistTierService,
  ) {}

  async findAll(query: ListArtistsQueryDto): Promise<ApiResponse<Artist[]>> {
    const where = this.buildListWhere(query);
    const artists = await this.prisma.artist.findMany({
      where,
      select: artistSelect,
    });

    const sorted = this.sortArtists(artists, query.sortBy);
    const page = query.page;
    const limit = query.limit;
    const total = sorted.length;
    const paged = sorted.slice((page - 1) * limit, page * limit);
    const settings = await this.platformConfigService.getSettings();

    return {
      data: paged.map((artist) => this.toArtist(artist, settings)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findCategories(): Promise<ApiResponse<ArtistCategory[]>> {
    const categories = await this.prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        iconUrl: true,
      },
    });

    return {
      data: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        iconUrl: category.iconUrl,
      })),
    };
  }

  async findBySlug(slug: string): Promise<Artist> {
    const artist = await this.prisma.artist.findUnique({
      where: { slug },
      select: artistSelect,
    });

    if (!artist || !artist.isLive) {
      throw new NotFoundException(`Artist not found: ${slug}`);
    }

    await this.prisma.artist.update({
      where: { id: artist.id },
      data: {
        profileViews: {
          increment: 1,
        },
      },
    });

    const refreshed = await this.prisma.artist.findUnique({
      where: { id: artist.id },
      select: artistSelect,
    });

    if (!refreshed) {
      throw new NotFoundException(`Artist not found: ${slug}`);
    }

    const settings = await this.platformConfigService.getSettings();
    return this.toArtist(refreshed, settings);
  }

  async findByUserId(userId: string): Promise<Artist | null> {
    const artist = await this.prisma.artist.findFirst({
      where: { userId },
      select: artistSelect,
    });
    if (!artist) {
      return null;
    }

    const [settings, tierProgress] = await Promise.all([
      this.platformConfigService.getSettings(),
      this.artistTierService.refreshArtistTier(artist.id),
    ]);

    return this.toArtist(artist, settings, tierProgress);
  }

  async upsertForUser(userId: string, input: UpsertArtistProfileDto): Promise<Artist> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        usernameNormalized: true,
        accountType: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }
    if (user.accountType !== 'CREATIVE') {
      throw new ForbiddenException('Only creative accounts can complete artist onboarding');
    }

    const normalized = this.normalizeProfileInput(input);
    const settings = await this.platformConfigService.getSettings();
    const existing = await this.prisma.artist.findFirst({
      where: { userId },
      select: {
        id: true,
        slug: true,
        applicationSequence: true,
        applicationStatus: true,
      },
    });

    const artist = await this.prisma.$transaction(async (tx) => {
      if (existing) {
        const nextApplicationSequence =
          existing.applicationSequence === null
            ? await this.platformConfigService.nextCounterValue(
                PLATFORM_COUNTER_KEYS.artistApplications,
                tx,
              )
            : null;

        return tx.artist.update({
          where: { id: existing.id },
          data: {
            displayName: normalized.displayName,
            name: normalized.displayName,
            role: normalized.role,
            location: normalized.location,
            bio: normalized.bio,
            hourlyRate: normalized.hourlyRate.toFixed(2),
            services: normalized.services,
            specialties: normalized.specialties,
            pricingSummary: normalized.pricingSummary,
            availabilitySummary: normalized.availabilitySummary,
            portfolioLinks: normalized.portfolioLinks,
            onboardingCompleted: true,
            onboardingFeeModel: settings.onboardingFeeModel as OnboardingFeeModel,
            normalCommissionRate: settings.normalCommissionRate.toFixed(2),
            temporaryFirstBookingCommissionRate:
              settings.temporaryFirstBookingCommissionRate.toFixed(2),
            applicationSubmittedAt:
              existing.applicationSequence === null ? new Date() : undefined,
            applicationStatus:
              nextApplicationSequence !== null
                ? this.resolveAutoApplicationStatus(
                    nextApplicationSequence,
                    settings.maxPrelaunchPoolSize,
                  )
                : undefined,
            applicationSequence:
              nextApplicationSequence ?? undefined,
          },
          select: artistSelect,
        });
      }

      const applicationSequence = await this.platformConfigService.nextCounterValue(
        PLATFORM_COUNTER_KEYS.artistApplications,
        tx,
      );
      const slug = await this.createUniqueSlug(
        user.usernameNormalized || user.username,
        tx,
      );
      return tx.artist.create({
        data: {
          slug,
          userId: user.id,
          displayName: normalized.displayName,
          name: normalized.displayName,
          role: normalized.role,
          location: normalized.location,
          hourlyRate: normalized.hourlyRate.toFixed(2),
          rating: 'New',
          bio: normalized.bio,
          services: normalized.services,
          specialties: normalized.specialties,
          pricingSummary: normalized.pricingSummary,
          availabilitySummary: normalized.availabilitySummary,
          portfolioLinks: normalized.portfolioLinks,
          onboardingCompleted: true,
          applicationStatus: this.resolveAutoApplicationStatus(
            applicationSequence,
            settings.maxPrelaunchPoolSize,
          ),
          applicationSequence,
          applicationSubmittedAt: new Date(),
          onboardingFeeModel: settings.onboardingFeeModel as OnboardingFeeModel,
          normalCommissionRate: settings.normalCommissionRate.toFixed(2),
          temporaryFirstBookingCommissionRate:
            settings.temporaryFirstBookingCommissionRate.toFixed(2),
        },
        select: artistSelect,
      });
    });

    const tierProgress = await this.artistTierService.refreshArtistTier(artist.id);
    return this.toArtist(artist, settings, tierProgress);
  }

  private buildListWhere(query: ListArtistsQueryDto): Prisma.ArtistWhereInput {
    const conditions: Prisma.ArtistWhereInput[] = [
      {
        isLive: true,
      },
    ];

    if (query.category) {
      conditions.push({
        category: {
          is: {
            slug: query.category,
          },
        },
      });
    }

    if (query.location) {
      conditions.push({
        location: {
          contains: query.location,
          mode: 'insensitive',
        },
      });
    }

    if (query.minRate !== undefined || query.maxRate !== undefined) {
      conditions.push({
        hourlyRate: {
          ...(query.minRate !== undefined ? { gte: query.minRate } : {}),
          ...(query.maxRate !== undefined ? { lte: query.maxRate } : {}),
        },
      });
    }

    if (query.available !== undefined) {
      conditions.push({
        isAvailable: query.available,
      });
    }

    if (query.tags && query.tags.length > 0) {
      conditions.push({
        tags: {
          hasEvery: query.tags,
        },
      });
    }

    if (query.q) {
      const terms = query.q
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 8);

      if (terms.length > 0) {
        conditions.push({
          OR: [
            {
              displayName: {
                contains: query.q,
                mode: 'insensitive',
              },
            },
            {
              bio: {
                contains: query.q,
                mode: 'insensitive',
              },
            },
            {
              tags: {
                hasSome: terms,
              },
            },
            {
              services: {
                hasSome: terms,
              },
            },
            {
              specialties: {
                hasSome: terms,
              },
            },
          ],
        });
      }
    }

    return conditions.length === 1 ? conditions[0] : { AND: conditions };
  }

  private sortArtists(
    artists: ArtistRecord[],
    sortBy: ListArtistsQueryDto['sortBy'],
  ): ArtistRecord[] {
    const cloned = [...artists];
    const tierOrder = (artist: ArtistRecord) => artist.tierSnapshot?.currentTier?.sortOrder ?? 0;

    cloned.sort((left, right) => {
      switch (sortBy) {
        case 'rate_asc':
          return this.compareNumbers(left.hourlyRate, right.hourlyRate);
        case 'rate_desc':
          return this.compareNumbers(right.hourlyRate, left.hourlyRate);
        case 'newest':
          return right.createdAt.getTime() - left.createdAt.getTime();
        case 'rating':
        default: {
          const tierDelta = tierOrder(right) - tierOrder(left);
          if (tierDelta !== 0) {
            return tierDelta;
          }
          const ratingDelta = right.averageRating - left.averageRating;
          if (ratingDelta !== 0) {
            return ratingDelta;
          }
          const reviewDelta = right.totalReviews - left.totalReviews;
          if (reviewDelta !== 0) {
            return reviewDelta;
          }
          return right.createdAt.getTime() - left.createdAt.getTime();
        }
      }
    });

    return cloned;
  }

  private compareNumbers(left: Prisma.Decimal, right: Prisma.Decimal): number {
    return Number(left.toString()) - Number(right.toString());
  }

  private normalizeProfileInput(input: UpsertArtistProfileDto) {
    return {
      displayName: input.displayName.trim(),
      role: input.role.trim(),
      location: input.location.trim(),
      bio: input.bio.trim(),
      hourlyRate: this.parseHourlyRate(input.pricingSummary),
      services: this.normalizeStringList(input.services),
      specialties: this.normalizeStringList(input.specialties),
      pricingSummary: this.normalizeOptionalString(input.pricingSummary),
      availabilitySummary: this.normalizeOptionalString(input.availabilitySummary),
      portfolioLinks: this.normalizeStringList(input.portfolioLinks),
    };
  }

  private normalizeStringList(values: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of values) {
      const value = raw.trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    }
    return out;
  }

  private normalizeOptionalString(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private parseHourlyRate(pricingSummary: string | null | undefined): number {
    if (!pricingSummary?.trim()) {
      return 2500;
    }

    const match = pricingSummary.match(/(\d[\d,\s.]*)/);
    if (!match) {
      return 2500;
    }

    const normalized = match[1].replace(/[,\s]/g, '');
    const parsed = Number.parseFloat(normalized);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 2500;
    }
    return Number(parsed.toFixed(2));
  }

  private async createUniqueSlug(
    baseValue: string,
    db: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<string> {
    const base = this.slugify(baseValue || 'artist');
    for (let index = 0; index < 100; index += 1) {
      const candidate = index === 0 ? base : `${base}-${index + 1}`;
      const existing = await db.artist.findUnique({
        where: { slug: candidate },
        select: { slug: true },
      });
      if (!existing) {
        return candidate;
      }
    }
    return `${base}-${Date.now()}`;
  }

  private slugify(value: string): string {
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    return normalized || 'artist';
  }

  private resolveAutoApplicationStatus(
    applicationSequence: number,
    maxPrelaunchPoolSize: number,
  ): ArtistApplicationStatus {
    return applicationSequence <= maxPrelaunchPoolSize
      ? ArtistApplicationStatus.PRELAUNCH_POOL
      : ArtistApplicationStatus.WAITLISTED;
  }

  private toArtist(
    artist: ArtistRecord,
    settings: Awaited<ReturnType<PlatformConfigService['getSettings']>>,
    tierProgress?: ArtistTierProgress,
  ): Artist {
    return {
      id: artist.id,
      userId: artist.userId,
      name: artist.displayName || artist.name,
      role: artist.role,
      location: artist.location,
      rating: artist.averageRating.toFixed(1),
      slug: artist.slug,
      hourlyRate:
        typeof artist.hourlyRate === 'number'
          ? artist.hourlyRate
          : Number(artist.hourlyRate.toString()),
      isAvailable: artist.isAvailable,
      isVerified: artist.isVerified,
      bio: artist.bio,
      tags: artist.tags,
      services: artist.services,
      specialties: artist.specialties,
      pricingSummary: artist.pricingSummary,
      availabilitySummary: artist.availabilitySummary,
      portfolioImages: artist.portfolioImages,
      portfolioLinks: artist.portfolioLinks,
      averageRating: artist.averageRating,
      totalReviews: artist.totalReviews,
      profileViews: artist.profileViews,
      category: artist.category
        ? {
            id: artist.category.id,
            name: artist.category.name,
            slug: artist.category.slug,
            iconUrl: artist.category.iconUrl,
          }
        : null,
      onboardingCompleted: artist.onboardingCompleted,
      applicationStatus: artist.applicationStatus,
      applicationSequence: artist.applicationSequence,
      applicationSubmittedAt: artist.applicationSubmittedAt?.toISOString() ?? null,
      applicationReviewedAt: artist.applicationReviewedAt?.toISOString() ?? null,
      applicationReviewNotes: artist.applicationReviewNotes,
      approvedAt: artist.approvedAt?.toISOString() ?? null,
      isLive: artist.isLive,
      wentLiveAt: artist.wentLiveAt?.toISOString() ?? null,
      onboardingFeeModel: artist.onboardingFeeModel,
      firstBookingOnboardingDeductionApplied:
        artist.firstBookingOnboardingDeductionApplied,
      firstBookingOnboardingDeductionAt:
        artist.firstBookingOnboardingDeductionAt?.toISOString() ?? null,
      normalCommissionRate: Number(artist.normalCommissionRate.toString()),
      temporaryFirstBookingCommissionRate: Number(
        artist.temporaryFirstBookingCommissionRate.toString(),
      ),
      applicationMessage: this.buildApplicationMessage(artist.applicationStatus, settings),
      tier: this.toTierDefinition(artist.tierSnapshot?.currentTier ?? null),
      tierProgress:
        tierProgress ??
        (artist.tierSnapshot
          ? this.snapshotToTierProgress(artist.tierSnapshot)
          : undefined),
      createdAt: artist.createdAt.toISOString(),
      updatedAt: artist.updatedAt.toISOString(),
    };
  }

  private buildApplicationMessage(
    status: ArtistApplicationStatus,
    settings: Awaited<ReturnType<PlatformConfigService['getSettings']>>,
  ): string {
    switch (status) {
      case ArtistApplicationStatus.PRELAUNCH_POOL:
        return `You are in the prelaunch pool. We are reviewing the first ${settings.maxPrelaunchPoolSize} artist applications and gradually opening ${settings.liveArtistSlotLimit} live slots.`;
      case ArtistApplicationStatus.WAITLISTED:
        return `The first ${settings.maxPrelaunchPoolSize} artist applications are currently full. Your profile is on the waitlist and will be reviewed as more rollout capacity opens in the coming months.`;
      case ArtistApplicationStatus.UNDER_REVIEW:
        return 'Your application is under manual review. We will notify you as soon as a decision is made.';
      case ArtistApplicationStatus.APPROVED:
        return 'Your application has been approved and is queued for a live slot. We will notify you the moment your public profile goes live.';
      case ArtistApplicationStatus.REJECTED:
        return 'Your application was not approved in its current form. An admin note will appear if more information is needed.';
      case ArtistApplicationStatus.LIVE:
        return 'Your artist profile is live and available for bookings on the platform.';
      case ArtistApplicationStatus.SUBMITTED:
      default:
        return 'Your artist application has been submitted and is waiting for routing into the rollout queue.';
    }
  }

  private toTierDefinition(
    definition: ArtistTierDefinitionRecord | null,
  ): ArtistTierDefinition | null {
    if (!definition) {
      return null;
    }

    return {
      id: definition.id,
      key: definition.key,
      name: definition.name,
      description: definition.description,
      sortOrder: definition.sortOrder,
      isActive: definition.isActive,
      thresholds: this.normalizeJsonObject(definition.thresholds),
      benefits: this.normalizeJsonObject(definition.benefits),
      createdAt: definition.createdAt.toISOString(),
      updatedAt: definition.updatedAt.toISOString(),
    };
  }

  private snapshotToTierProgress(
    snapshot: NonNullable<ArtistRecord['tierSnapshot']>,
  ): ArtistTierProgress {
    const details = this.normalizeJsonObject<{ reasons?: string[] }>(snapshot.evaluationDetails);
    return {
      currentTier: this.toTierDefinition(snapshot.currentTier),
      evaluatedTier: this.toTierDefinition(snapshot.evaluatedTier),
      manualTier: this.toTierDefinition(snapshot.manualTier),
      nextTier: null,
      progressPercent: 0,
      metrics: {
        completedPlatformBookings: snapshot.completedPlatformBookings,
        verifiedPlatformBookings: snapshot.verifiedPlatformBookings,
        platformRevenue: Number(snapshot.platformRevenue.toString()),
        averageRating: snapshot.averageRating,
        cancellationCount: snapshot.cancellationCount,
        reliabilityScore: snapshot.reliabilityScore,
        responseTimeMinutes: snapshot.responseTimeMinutes,
        disputeCount: snapshot.disputeCount,
        disputeRate: snapshot.disputeRate,
        profileCompleteness: snapshot.profileCompleteness,
        repeatBookings: snapshot.repeatBookings,
      },
      reasons: details.reasons ?? [],
      lastEvaluatedAt: snapshot.lastEvaluatedAt?.toISOString() ?? null,
    };
  }

  private normalizeJsonObject<T extends object>(value: Prisma.JsonValue | null): T {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return {} as T;
    }
    return value as T;
  }
}
