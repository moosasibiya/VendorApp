import { Injectable, NotFoundException } from '@nestjs/common';
import type { Artist } from '@vendorapp/shared';

@Injectable()
export class ArtistsService {
  private readonly artists: Artist[] = Array.from({ length: 12 }).map((_, i) => ({
    name: `Artist ${i + 1}`,
    role: i % 2 === 0 ? 'Photographer' : 'Videographer',
    location: ['Cape Town', 'Johannesburg', 'Pretoria', 'Durban', 'All'][i % 5],
    rating: (4.7 + (i % 3) * 0.1).toFixed(1),
    slug: `artist-${i + 1}`,
  }));

  findAll(): Artist[] {
    return this.artists;
  }

  findBySlug(slug: string): Artist {
    const artist = this.artists.find((item) => item.slug === slug);
    if (!artist) {
      throw new NotFoundException(`Artist not found: ${slug}`);
    }
    return artist;
  }
}
