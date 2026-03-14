import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ArtistReviewsController } from './artist-reviews.controller';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ReviewsController, ArtistReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
