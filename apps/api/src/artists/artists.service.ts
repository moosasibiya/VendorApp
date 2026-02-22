import { Injectable, NotFoundException } from '@nestjs/common';
import type { Artist } from '@vendorapp/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArtistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Artist[]> {
    const artists = await this.prisma.artist.findMany({
      orderBy: { slug: 'asc' },
    });
    return artists.map((artist) => ({
      name: artist.name,
      role: artist.role,
      location: artist.location,
      rating: artist.rating,
      slug: artist.slug,
    }));
  }

  async findBySlug(slug: string): Promise<Artist> {
    const artist = await this.prisma.artist.findUnique({
      where: { slug },
    });
    if (!artist) {
      throw new NotFoundException(`Artist not found: ${slug}`);
    }
    return {
      name: artist.name,
      role: artist.role,
      location: artist.location,
      rating: artist.rating,
      slug: artist.slug,
    };
  }
}
