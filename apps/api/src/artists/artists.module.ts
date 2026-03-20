import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlatformModule } from '../platform/platform.module';
import { ArtistTierService } from './artist-tier.service';
import { ArtistsController } from './artists.controller';
import { CategoriesController } from './categories.controller';
import { ArtistsService } from './artists.service';

@Module({
  imports: [AuthModule, PlatformModule],
  controllers: [ArtistsController, CategoriesController],
  providers: [ArtistsService, ArtistTierService],
  exports: [ArtistsService, ArtistTierService],
})
export class ArtistsModule {}
