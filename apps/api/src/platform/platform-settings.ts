import type { PlatformSettings } from '@vendorapp/shared';
import { OnboardingFeeModel } from '@prisma/client';

export const PLATFORM_SETTING_KEYS = {
  maxPrelaunchPoolSize: 'maxPrelaunchPoolSize',
  liveArtistSlotLimit: 'liveArtistSlotLimit',
  onboardingFeeModel: 'onboardingFeeModel',
  normalCommissionRate: 'normalCommissionRate',
  temporaryFirstBookingCommissionRate: 'temporaryFirstBookingCommissionRate',
  disputeWindowDays: 'disputeWindowDays',
  bookingStartCodeLength: 'bookingStartCodeLength',
  startCodeActivationHours: 'startCodeActivationHours',
  clientApprovalGraceHours: 'clientApprovalGraceHours',
} as const;

export type PlatformSettingKey =
  (typeof PLATFORM_SETTING_KEYS)[keyof typeof PLATFORM_SETTING_KEYS];

export const PLATFORM_SETTINGS_DEFAULTS: PlatformSettings = {
  maxPrelaunchPoolSize: 100,
  liveArtistSlotLimit: 20,
  onboardingFeeModel: OnboardingFeeModel.FIRST_BOOKING_DEDUCTION,
  normalCommissionRate: 15,
  temporaryFirstBookingCommissionRate: 25,
  disputeWindowDays: 3,
  bookingStartCodeLength: 6,
  startCodeActivationHours: 24,
  clientApprovalGraceHours: 24,
};

export const PLATFORM_COUNTER_KEYS = {
  artistApplications: 'artistApplications',
  supportTickets: 'supportTickets',
} as const;

export type PlatformCounterKey =
  (typeof PLATFORM_COUNTER_KEYS)[keyof typeof PLATFORM_COUNTER_KEYS];
