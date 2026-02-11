import { Controller, Get, Param } from '@nestjs/common';
import { ArtistsService } from './artists.service';
import type { Artist } from '@vendorapp/shared';

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Get()
  findAll(): Artist[] {
    return this.artistsService.findAll();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Artist {
    return this.artistsService.findBySlug(slug);
  }
}
