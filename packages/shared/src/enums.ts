export enum UserRole {
  CLIENT = 'CLIENT',
  ARTIST = 'ARTIST',
  AGENCY = 'AGENCY',
  ADMIN = 'ADMIN',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export enum NotificationType {
  BOOKING_REQUEST = 'BOOKING_REQUEST',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
}

export const ACCOUNT_TYPE_VALUES = ['CREATIVE', 'CLIENT', 'AGENCY'] as const;
export type AccountType = (typeof ACCOUNT_TYPE_VALUES)[number];

export const CURRENT_BOOKING_STATUS_VALUES = [
  'Pending',
  'Confirmed',
  'Completed',
  'Cancelled',
] as const;
export type CurrentBookingStatus = (typeof CURRENT_BOOKING_STATUS_VALUES)[number];
