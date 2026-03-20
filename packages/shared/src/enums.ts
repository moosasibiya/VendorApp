export enum UserRole {
  CLIENT = 'CLIENT',
  ARTIST = 'ARTIST',
  AGENCY = 'AGENCY',
  ADMIN = 'ADMIN',
  SUB_ADMIN = 'SUB_ADMIN',
}
export type UserRoleValue = `${UserRole}`;

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  BOOKED = 'BOOKED',
  AWAITING_START_CODE = 'AWAITING_START_CODE',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_CLIENT_APPROVAL = 'AWAITING_CLIENT_APPROVAL',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  PAYOUT_PENDING = 'PAYOUT_PENDING',
  PAYOUT_RELEASED = 'PAYOUT_RELEASED',
  CANCELLED = 'CANCELLED',
}
export type BookingStatusValue = `${BookingStatus}`;

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}
export type PaymentStatusValue = `${PaymentStatus}`;

export enum PaymentProvider {
  PAYFAST = 'PAYFAST',
}
export type PaymentProviderValue = `${PaymentProvider}`;

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}
export type MessageTypeValue = `${MessageType}`;

export enum NotificationType {
  BOOKING_REQUEST = 'BOOKING_REQUEST',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  SUPPORT_THREAD_CREATED = 'SUPPORT_THREAD_CREATED',
  SUPPORT_THREAD_UPDATED = 'SUPPORT_THREAD_UPDATED',
  ARTIST_APPLICATION_UPDATED = 'ARTIST_APPLICATION_UPDATED',
  PAYOUT_STATUS_UPDATED = 'PAYOUT_STATUS_UPDATED',
}
export type NotificationTypeValue = `${NotificationType}`;

export enum ArtistApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  PRELAUNCH_POOL = 'PRELAUNCH_POOL',
  WAITLISTED = 'WAITLISTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  LIVE = 'LIVE',
}
export type ArtistApplicationStatusValue = `${ArtistApplicationStatus}`;

export enum OnboardingFeeModel {
  UPFRONT = 'UPFRONT',
  FIRST_BOOKING_DEDUCTION = 'FIRST_BOOKING_DEDUCTION',
}
export type OnboardingFeeModelValue = `${OnboardingFeeModel}`;

export enum ConversationKind {
  DIRECT = 'DIRECT',
  BOOKING = 'BOOKING',
  SUPPORT = 'SUPPORT',
}
export type ConversationKindValue = `${ConversationKind}`;

export enum SupportCategory {
  BOOKING_HELP = 'BOOKING_HELP',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  PROFILE_ISSUE = 'PROFILE_ISSUE',
  DISPUTE_HELP = 'DISPUTE_HELP',
  REFUND_HELP = 'REFUND_HELP',
  OTHER = 'OTHER',
}
export type SupportCategoryValue = `${SupportCategory}`;

export enum SupportThreadStatus {
  OPEN = 'OPEN',
  AWAITING_USER = 'AWAITING_USER',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
}
export type SupportThreadStatusValue = `${SupportThreadStatus}`;

export enum BookingVerificationStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  MANUAL_OVERRIDE = 'MANUAL_OVERRIDE',
}
export type BookingVerificationStatusValue = `${BookingVerificationStatus}`;

export enum PayoutStatus {
  NOT_READY = 'NOT_READY',
  PENDING = 'PENDING',
  ON_HOLD = 'ON_HOLD',
  RELEASED = 'RELEASED',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
}
export type PayoutStatusValue = `${PayoutStatus}`;

export const ACCOUNT_TYPE_VALUES = ['CREATIVE', 'CLIENT', 'AGENCY'] as const;
export type AccountType = (typeof ACCOUNT_TYPE_VALUES)[number];

export const ADMIN_ROLE_VALUES = [UserRole.ADMIN, UserRole.SUB_ADMIN] as const;
export type AdminRoleValue = (typeof ADMIN_ROLE_VALUES)[number];

export const CURRENT_BOOKING_STATUS_VALUES = [
  'Pending',
  'Confirmed',
  'Completed',
  'Cancelled',
] as const;
export type CurrentBookingStatus = (typeof CURRENT_BOOKING_STATUS_VALUES)[number];
