export interface ArtistCategory {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
}

export interface Artist {
  id?: string;
  userId?: string | null;
  name: string;
  role: string;
  location: string;
  rating: string;
  slug: string;
  hourlyRate?: number;
  isAvailable?: boolean;
  isVerified?: boolean;
  bio?: string;
  tags?: string[];
  services?: string[];
  specialties?: string[];
  pricingSummary?: string | null;
  availabilitySummary?: string | null;
  portfolioImages?: string[];
  portfolioLinks?: string[];
  averageRating?: number;
  totalReviews?: number;
  category?: ArtistCategory | null;
  onboardingCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ArtistSortBy = 'rating' | 'rate_asc' | 'rate_desc' | 'newest';

export interface ArtistSearchParams {
  category?: string;
  location?: string;
  minRate?: number;
  maxRate?: number;
  available?: boolean;
  tags?: string[];
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: ArtistSortBy;
}

export interface ArtistProfileInput {
  displayName: string;
  role: string;
  location: string;
  bio: string;
  services: string[];
  specialties: string[];
  pricingSummary: string;
  availabilitySummary: string;
  portfolioLinks: string[];
}
