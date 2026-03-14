import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ArtistsController } from './artists.controller';
import { CategoriesController } from './categories.controller';
import { ArtistsService } from './artists.service';

@Module({
  imports: [AuthModule],
  controllers: [ArtistsController, CategoriesController],
  providers: [ArtistsService],
})
export class ArtistsModule {}
