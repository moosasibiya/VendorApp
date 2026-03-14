import { Body, Controller, Get, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { ApiResponse, MyReviewsOverview, ReviewItem } from '@vendorapp/shared';
import { AuthGuard } from '../auth/auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ReviewsService } from './reviews.service';

type AuthenticatedRequest = {
  auth?: {
    userId: string;
  };
};

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateReviewDto,
  ): Promise<ApiResponse<ReviewItem>> {
    return this.reviewsService.create(this.getUserId(request), input);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async listMine(@Req() request: AuthenticatedRequest): Promise<MyReviewsOverview> {
    return this.reviewsService.listMine(this.getUserId(request));
  }

  private getUserId(request: AuthenticatedRequest): string {
    const userId = request.auth?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user context missing');
    }
    return userId;
  }
}
