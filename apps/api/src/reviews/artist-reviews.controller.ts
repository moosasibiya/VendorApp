import { Controller, Get, Param, Query } from '@nestjs/common';
import type { ApiResponse, ReviewItem } from '@vendorapp/shared';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ReviewsService } from './reviews.service';

@Controller('artists')
export class ArtistReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':slug/reviews')
  async listArtistReviews(
    @Param('slug') slug: string,
    @Query() query: ListReviewsQueryDto,
  ): Promise<ApiResponse<ReviewItem[]>> {
    return this.reviewsService.listArtistReviews(slug, query);
  }
}
