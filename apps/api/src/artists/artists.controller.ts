import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ArtistsService } from './artists.service';
import type { Artist } from '@vendorapp/shared';
import { AuthGuard } from '../auth/auth.guard';
import { UpsertArtistProfileDto } from './dto/upsert-artist-profile.dto';

type AuthRequest = {
  auth: {
    userId: string;
  };
};

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Get()
  async findAll(): Promise<Artist[]> {
    return this.artistsService.findAll();
  }

  @Get('me/profile')
  @UseGuards(AuthGuard)
  async findMyProfile(@Req() req: AuthRequest): Promise<Artist | null> {
    return this.artistsService.findByUserId(req.auth.userId);
  }

  @Put('me/profile')
  @UseGuards(AuthGuard)
  async upsertMyProfile(
    @Req() req: AuthRequest,
    @Body() input: UpsertArtistProfileDto,
  ): Promise<Artist> {
    return this.artistsService.upsertForUser(req.auth.userId, input);
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string): Promise<Artist> {
    return this.artistsService.findBySlug(slug);
  }
}
