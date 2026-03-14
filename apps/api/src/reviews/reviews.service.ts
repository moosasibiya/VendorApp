import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, NotificationType, Prisma } from '@prisma/client';
import type { ApiResponse, MyReviewsOverview, ReviewItem } from '@vendorapp/shared';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';

const reviewSelect = {
  id: true,
  bookingId: true,
  rating: true,
  comment: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
  booking: {
    select: {
      title: true,
      eventDate: true,
    },
  },
  reviewer: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
    },
  },
  artist: {
    select: {
      id: true,
      slug: true,
      displayName: true,
    },
  },
} satisfies Prisma.ReviewSelect;

type ReviewRecord = Prisma.ReviewGetPayload<{
  select: typeof reviewSelect;
}>;

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, input: CreateReviewDto): Promise<ApiResponse<ReviewItem>> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        clientId: true,
        artistId: true,
        status: true,
        title: true,
        eventDate: true,
        review: {
          select: {
            id: true,
          },
        },
        artist: {
          select: {
            id: true,
            slug: true,
            displayName: true,
            userId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.clientId !== userId) {
      throw new ForbiddenException('Only the booking client can leave a review');
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Reviews can only be left for completed bookings');
    }
    if (booking.review) {
      throw new ConflictException('A review has already been submitted for this booking');
    }

    let createdReview!: ReviewRecord;
    let createdNotifications: Awaited<
      ReturnType<NotificationsService['createMany']>
    > = [];

    await this.prisma.$transaction(async (tx) => {
      createdReview = await tx.review.create({
        data: {
          bookingId: booking.id,
          reviewerId: userId,
          artistId: booking.artistId,
          rating: input.rating,
          comment: input.comment.trim(),
          isPublic: input.isPublic ?? true,
        },
        select: reviewSelect,
      });

      const aggregates = await tx.review.aggregate({
        where: {
          artistId: booking.artistId,
        },
        _avg: {
          rating: true,
        },
        _count: {
          id: true,
        },
      });

      const averageRating = Number(aggregates._avg.rating ?? 0);
      const totalReviews = aggregates._count.id;

      await tx.artist.update({
        where: {
          id: booking.artistId,
        },
        data: {
          averageRating,
          totalReviews,
          rating: averageRating.toFixed(1),
        },
      });

      if (booking.artist.userId) {
        createdNotifications = await this.notificationsService.createMany(tx, [
          {
            userId: booking.artist.userId,
            type: NotificationType.REVIEW_RECEIVED,
            title: 'New review received',
            body: `A client left a ${input.rating}-star review for "${booking.title}".`,
            metadata: {
              bookingId: booking.id,
              reviewId: createdReview.id,
              artistSlug: booking.artist.slug,
            },
          },
        ]);
      }
    });

    this.notificationsService.emitMany(createdNotifications);

    return {
      data: this.toReviewItem(createdReview),
    };
  }

  async listArtistReviews(
    slug: string,
    query: ListReviewsQueryDto,
  ): Promise<ApiResponse<ReviewItem[]>> {
    const artist = await this.prisma.artist.findUnique({
      where: { slug },
      select: {
        id: true,
      },
    });

    if (!artist) {
      throw new NotFoundException('Artist not found');
    }

    const where: Prisma.ReviewWhereInput = {
      artistId: artist.id,
      isPublic: true,
    };
    const total = await this.prisma.review.count({ where });
    const reviews = await this.prisma.review.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      select: reviewSelect,
    });

    return {
      data: reviews.map((review) => this.toReviewItem(review)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      },
    };
  }

  async listMine(userId: string): Promise<MyReviewsOverview> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        artistProfile: {
          select: {
            id: true,
            averageRating: true,
            totalReviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [left, received] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          reviewerId: user.id,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 20,
        select: reviewSelect,
      }),
      user.artistProfile
        ? this.prisma.review.findMany({
            where: {
              artistId: user.artistProfile.id,
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: 20,
            select: reviewSelect,
          })
        : Promise.resolve([] as ReviewRecord[]),
    ]);

    return {
      left: left.map((review) => this.toReviewItem(review)),
      received: received.map((review) => this.toReviewItem(review)),
      averageRating: user.artistProfile?.averageRating ?? 0,
      totalReviews: user.artistProfile?.totalReviews ?? 0,
    };
  }

  private toReviewItem(review: ReviewRecord): ReviewItem {
    return {
      id: review.id,
      bookingId: review.bookingId,
      rating: review.rating,
      comment: review.comment,
      isPublic: review.isPublic,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      bookingTitle: review.booking.title,
      eventDate: review.booking.eventDate.toISOString(),
      reviewer: {
        id: review.reviewer.id,
        name: review.reviewer.fullName,
        avatarUrl: review.reviewer.avatarUrl,
      },
      artist: {
        id: review.artist.id,
        name: review.artist.displayName,
        slug: review.artist.slug,
      },
    };
  }
}
