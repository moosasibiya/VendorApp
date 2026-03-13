export interface Artist {
  id?: string;
  userId?: string | null;
  name: string;
  role: string;
  location: string;
  rating: string;
  slug: string;
  bio?: string;
  services?: string[];
  specialties?: string[];
  pricingSummary?: string | null;
  availabilitySummary?: string | null;
  portfolioLinks?: string[];
  onboardingCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
