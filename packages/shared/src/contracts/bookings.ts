import type {
  BookingStatusValue,
  BookingVerificationStatusValue,
  PaymentProviderValue,
  PaymentStatusValue,
  PayoutStatusValue,
  UserRoleValue,
} from '../enums';

export const BOOKING_ACTION_VALUES = [
  'confirm',
  'cancel',
  'complete',
  'approve_completion',
  'dispute',
] as const;
export type BookingAction = (typeof BOOKING_ACTION_VALUES)[number];

export interface BookingClientSummary {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface BookingArtistSummary {
  id: string;
  userId?: string | null;
  name: string;
  slug: string;
  avatarUrl?: string | null;
  hourlyRate: number;
  location: string;
  isAvailable: boolean;
}

export interface BookingAgencySummary {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export interface BookingTimelineEvent {
  id: string;
  fromStatus?: BookingStatusValue | null;
  toStatus: BookingStatusValue;
  action: string;
  reason?: string | null;
  actorUserId?: string | null;
  actorName?: string | null;
  actorRole?: UserRoleValue | null;
  createdAt: string;
}

export interface BookingAuditEvent {
  id: string;
  eventType: string;
  message?: string | null;
  actorUserId?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface BookingReviewSummary {
  id: string;
  rating: number;
  comment: string;
  isPublic: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  clientId: string;
  artistId: string;
  agencyId?: string | null;
  title: string;
  description: string;
  eventDate: string;
  eventEndDate?: string | null;
  location: string;
  status: BookingStatusValue;
  totalAmount: number;
  platformFee: number;
  artistPayout: number;
  paymentProvider?: PaymentProviderValue | null;
  paymentStatus: PaymentStatusValue;
  stripePaymentIntentId?: string | null;
  paymentReference?: string | null;
  paymentGatewayReference?: string | null;
  paymentInitiatedAt?: string | null;
  paymentPaidAt?: string | null;
  paymentFailedAt?: string | null;
  notes?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  verificationStatus: BookingVerificationStatusValue;
  verificationCode?: string | null;
  verificationCodeSentAt?: string | null;
  verificationCodeExpiresAt?: string | null;
  verificationEnteredAt?: string | null;
  verificationAttempts?: number;
  jobStartedAt?: string | null;
  jobCompletedAt?: string | null;
  clientApprovedAt?: string | null;
  disputeOpenedAt?: string | null;
  disputeWindowDays?: number;
  disputeWindowEndsAt?: string | null;
  payoutStatus: PayoutStatusValue;
  payoutPendingAt?: string | null;
  estimatedPayoutReleaseAt?: string | null;
  payoutReleasedAt?: string | null;
  payoutHoldReason?: string | null;
  payoutDelayDaysSnapshot?: number;
  normalCommissionRate?: number;
  appliedCommissionRate?: number;
  onboardingExtraCutAmount?: number;
  createdAt: string;
  updatedAt: string;
  client: BookingClientSummary;
  artist: BookingArtistSummary;
  agency?: BookingAgencySummary | null;
  timeline?: BookingTimelineEvent[];
  auditEvents?: BookingAuditEvent[];
  availableActions?: BookingAction[];
  review?: BookingReviewSummary | null;
  canReview?: boolean;
}

export interface PaymentCheckoutSession {
  bookingId: string;
  provider: PaymentProviderValue;
  method: 'POST';
  gatewayUrl: string;
  formFields: Record<string, string>;
}
