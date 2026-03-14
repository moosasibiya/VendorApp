import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ApiResponse, Artist, ArtistCategory } from '@vendorapp/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { UpsertArtistProfileDto } from './dto/upsert-artist-profile.dto';
import { ListArtistsQueryDto } from './dto/list-artists-query.dto';

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
} satisfies Prisma.ArtistSelect;

type ArtistRecord = Prisma.ArtistGetPayload<{
  select: typeof artistSelect;
}>;

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListArtistsQueryDto): Promise<ApiResponse<Artist[]>> {
    const where = this.buildListWhere(query);
    const total = await this.prisma.artist.count({ where });
    const artists = await this.prisma.artist.findMany({
      where,
      orderBy: this.getOrderBy(query.sortBy),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: artistSelect,
    });

    return {
      data: artists.map((artist) => this.toArtist(artist)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
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
    let artist: ArtistRecord;
    try {
      artist = await this.prisma.artist.update({
        where: { slug },
        data: {
          profileViews: {
            increment: 1,
          },
        },
        select: artistSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Artist not found: ${slug}`);
      }
      throw error;
    }

    if (!artist) {
      throw new NotFoundException(`Artist not found: ${slug}`);
    }
    return this.toArtist(artist);
  }

  async findByUserId(userId: string): Promise<Artist | null> {
    const artist = await this.prisma.artist.findFirst({
      where: { userId },
      select: artistSelect,
    });
    return artist ? this.toArtist(artist) : null;
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
    const existing = await this.prisma.artist.findFirst({
      where: { userId },
    });

    if (existing) {
      const updated = await this.prisma.artist.update({
        where: { slug: existing.slug },
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
        },
        select: artistSelect,
      });
      return this.toArtist(updated);
    }

    const slug = await this.createUniqueSlug(user.usernameNormalized || user.username);
    const created = await this.prisma.artist.create({
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
      },
      select: artistSelect,
    });

    return this.toArtist(created);
  }

  private buildListWhere(query: ListArtistsQueryDto): Prisma.ArtistWhereInput {
    const conditions: Prisma.ArtistWhereInput[] = [];

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

    if (conditions.length === 0) {
      return {};
    }

    return {
      AND: conditions,
    };
  }

  private getOrderBy(sortBy: ListArtistsQueryDto['sortBy']): Prisma.ArtistOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'rate_asc':
        return [{ hourlyRate: 'asc' }, { createdAt: 'desc' }];
      case 'rate_desc':
        return [{ hourlyRate: 'desc' }, { createdAt: 'desc' }];
      case 'newest':
        return [{ createdAt: 'desc' }];
      case 'rating':
      default:
        return [{ averageRating: 'desc' }, { totalReviews: 'desc' }, { createdAt: 'desc' }];
    }
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

  private async createUniqueSlug(baseValue: string): Promise<string> {
    const base = this.slugify(baseValue || 'artist');
    for (let index = 0; index < 100; index += 1) {
      const candidate = index === 0 ? base : `${base}-${index + 1}`;
      const existing = await this.prisma.artist.findUnique({
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

  private toArtist(artist: ArtistRecord): Artist {
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
      createdAt: artist.createdAt.toISOString(),
      updatedAt: artist.updatedAt.toISOString(),
    };
  }
}
