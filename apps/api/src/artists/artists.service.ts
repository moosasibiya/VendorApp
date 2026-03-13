import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Artist, ArtistProfileInput } from '@vendorapp/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { UpsertArtistProfileDto } from './dto/upsert-artist-profile.dto';

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Artist[]> {
    const artists = await this.prisma.artist.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return artists.map((artist) => this.toArtist(artist));
  }

  async findBySlug(slug: string): Promise<Artist> {
    const artist = await this.prisma.artist.findUnique({
      where: { slug },
    });
    if (!artist) {
      throw new NotFoundException(`Artist not found: ${slug}`);
    }
    return this.toArtist(artist);
  }

  async findByUserId(userId: string): Promise<Artist | null> {
    const artist = await this.prisma.artist.findFirst({
      where: { userId },
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
    });

    return this.toArtist(created);
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

  private toArtist(artist: {
    id: string;
    userId: string | null;
    displayName: string;
    name: string;
    role: string;
    location: string;
    hourlyRate: Prisma.Decimal | number;
    isAvailable: boolean;
    rating: string;
    slug: string;
    bio: string;
    services: string[];
    specialties: string[];
    pricingSummary: string | null;
    availabilitySummary: string | null;
    portfolioLinks: string[];
    onboardingCompleted: boolean;
  }): Artist {
    return {
      id: artist.id,
      userId: artist.userId,
      name: artist.displayName || artist.name,
      role: artist.role,
      location: artist.location,
      rating: artist.rating,
      slug: artist.slug,
      hourlyRate:
        typeof artist.hourlyRate === 'number'
          ? artist.hourlyRate
          : Number(artist.hourlyRate.toString()),
      isAvailable: artist.isAvailable,
      bio: artist.bio,
      services: artist.services,
      specialties: artist.specialties,
      pricingSummary: artist.pricingSummary,
      availabilitySummary: artist.availabilitySummary,
      portfolioLinks: artist.portfolioLinks,
      onboardingCompleted: artist.onboardingCompleted,
    };
  }
}
