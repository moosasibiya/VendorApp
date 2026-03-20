import type {
  ArtistApplicationStatusValue,
  OnboardingFeeModelValue,
  PayoutStatusValue,
  SupportThreadStatusValue,
} from '../enums';
import type { BookingVerificationStatusValue } from '../enums';
import type { ArtistTierAdminRow, ArtistTierDefinition } from './tiers';

export interface PlatformSettings {
  maxPrelaunchPoolSize: number;
  liveArtistSlotLimit: number;
  onboardingFeeModel: OnboardingFeeModelValue;
  normalCommissionRate: number;
  temporaryFirstBookingCommissionRate: number;
  disputeWindowDays: number;
  bookingStartCodeLength: number;
  startCodeActivationHours: number;
  clientApprovalGraceHours: number;
}

export interface AdminArtistApplicationItem {
  artistId: string;
  userId?: string | null;
  displayName: string;
  slug: string;
  location: string;
  role: string;
  applicationStatus: ArtistApplicationStatusValue;
  applicationSequence?: number | null;
  applicationSubmittedAt?: string | null;
  applicationReviewedAt?: string | null;
  applicationReviewNotes?: string | null;
  approvedAt?: string | null;
  isLive: boolean;
  wentLiveAt?: string | null;
  firstBookingOnboardingDeductionApplied: boolean;
  normalCommissionRate: number;
  temporaryFirstBookingCommissionRate: number;
}

export interface AdminArtistApplicationSummary {
  items: AdminArtistApplicationItem[];
  liveSlotsUsed: number;
  liveSlotLimit: number;
  prelaunchPoolCount: number;
  waitlistCount: number;
}

export interface AdminSupportThreadItem {
  conversationId: string;
  ticketNumber?: string | null;
  subject?: string | null;
  status?: SupportThreadStatusValue | null;
  category?: string | null;
  bookingId?: string | null;
  requesterName: string;
  assignedAdminName?: string | null;
  lastMessageAt: string;
  createdAt: string;
}

export interface AdminBookingReviewItem {
  bookingId: string;
  title: string;
  status: string;
  payoutStatus: PayoutStatusValue;
  verificationStatus: BookingVerificationStatusValue;
  payoutHoldReason?: string | null;
  disputeWindowEndsAt?: string | null;
  estimatedPayoutReleaseAt?: string | null;
  artistName: string;
  clientName: string;
}

export interface AdminDashboardData {
  settings: PlatformSettings;
  artistApplications: AdminArtistApplicationSummary;
  supportThreads: AdminSupportThreadItem[];
  manualReviewBookings: AdminBookingReviewItem[];
  tierDefinitions: ArtistTierDefinition[];
  tierRows: ArtistTierAdminRow[];
}
