import type { ArtistApplicationStatusValue } from '../enums';

export interface ArtistTierThresholds {
  completedPlatformBookings?: number;
  verifiedPlatformBookings?: number;
  platformRevenue?: number;
  averageRating?: number;
  minReliabilityScore?: number;
  maxDisputeRate?: number;
  minProfileCompleteness?: number;
  minRepeatBookings?: number;
  maxResponseTimeMinutes?: number;
}

export interface ArtistTierBenefits {
  visibilityBoost?: number;
  recommendedBoost?: number;
  payoutDelayDays?: number;
  accessToSpecialOpportunities?: boolean;
  badgeLabel?: string | null;
  trustIndicator?: string | null;
}

export interface ArtistTierDefinition {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  thresholds: ArtistTierThresholds;
  benefits: ArtistTierBenefits;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistTierMetrics {
  completedPlatformBookings: number;
  verifiedPlatformBookings: number;
  platformRevenue: number;
  averageRating: number;
  cancellationCount: number;
  reliabilityScore: number;
  responseTimeMinutes?: number | null;
  disputeCount: number;
  disputeRate: number;
  profileCompleteness: number;
  repeatBookings: number;
}

export interface ArtistTierProgress {
  currentTier?: ArtistTierDefinition | null;
  evaluatedTier?: ArtistTierDefinition | null;
  manualTier?: ArtistTierDefinition | null;
  nextTier?: ArtistTierDefinition | null;
  progressPercent: number;
  metrics: ArtistTierMetrics;
  reasons: string[];
  lastEvaluatedAt?: string | null;
}

export interface ArtistTierAdminRow {
  artistId: string;
  artistName: string;
  artistSlug: string;
  applicationStatus: ArtistApplicationStatusValue;
  currentTier?: ArtistTierDefinition | null;
  evaluatedTier?: ArtistTierDefinition | null;
  manualTier?: ArtistTierDefinition | null;
  progress: ArtistTierProgress;
}
