export interface ReviewPartySummary {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface ReviewArtistSummary {
  id: string;
  name: string;
  slug: string;
}

export interface ReviewItem {
  id: string;
  bookingId: string;
  rating: number;
  comment: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  bookingTitle: string;
  eventDate: string;
  reviewer: ReviewPartySummary;
  artist: ReviewArtistSummary;
}

export interface MyReviewsOverview {
  left: ReviewItem[];
  received: ReviewItem[];
  averageRating: number;
  totalReviews: number;
}
