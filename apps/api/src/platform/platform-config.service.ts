import { Injectable } from '@nestjs/common';
import { OnboardingFeeModel, Prisma } from '@prisma/client';
import type { PlatformSettings } from '@vendorapp/shared';
import { PrismaService } from '../prisma/prisma.service';
import {
  PLATFORM_COUNTER_KEYS,
  PLATFORM_SETTING_KEYS,
  PLATFORM_SETTINGS_DEFAULTS,
  type PlatformCounterKey,
  type PlatformSettingKey,
} from './platform-settings';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class PlatformConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(db: DbClient = this.prisma): Promise<PlatformSettings> {
    const keys = Object.values(PLATFORM_SETTING_KEYS);
    const records = await db.systemSetting.findMany({
      where: {
        key: {
          in: keys,
        },
      },
    });

    const values = new Map(records.map((record) => [record.key, record.value]));

    return {
      maxPrelaunchPoolSize: this.readNumber(values, PLATFORM_SETTING_KEYS.maxPrelaunchPoolSize),
      liveArtistSlotLimit: this.readNumber(values, PLATFORM_SETTING_KEYS.liveArtistSlotLimit),
      onboardingFeeModel: this.readOnboardingFeeModel(values),
      normalCommissionRate: this.readNumber(values, PLATFORM_SETTING_KEYS.normalCommissionRate),
      temporaryFirstBookingCommissionRate: this.readNumber(
        values,
        PLATFORM_SETTING_KEYS.temporaryFirstBookingCommissionRate,
      ),
      disputeWindowDays: this.readNumber(values, PLATFORM_SETTING_KEYS.disputeWindowDays),
      bookingStartCodeLength: this.readNumber(values, PLATFORM_SETTING_KEYS.bookingStartCodeLength),
      startCodeActivationHours: this.readNumber(
        values,
        PLATFORM_SETTING_KEYS.startCodeActivationHours,
      ),
      clientApprovalGraceHours: this.readNumber(
        values,
        PLATFORM_SETTING_KEYS.clientApprovalGraceHours,
      ),
    };
  }

  async updateSettings(
    userId: string,
    updates: Partial<PlatformSettings>,
    db: DbClient = this.prisma,
  ): Promise<PlatformSettings> {
    const entries = Object.entries(updates) as Array<[PlatformSettingKey, PlatformSettings[keyof PlatformSettings]]>;
    if (entries.length === 0) {
      return this.getSettings(db);
    }

    for (const [key, value] of entries) {
      await db.systemSetting.upsert({
        where: { key },
        update: {
          value: value as Prisma.InputJsonValue,
          updatedByUserId: userId,
          description: this.getDescription(key),
        },
        create: {
          key,
          value: value as Prisma.InputJsonValue,
          updatedByUserId: userId,
          description: this.getDescription(key),
        },
      });
    }

    return this.getSettings(db);
  }

  async nextCounterValue(
    key: PlatformCounterKey,
    db: DbClient = this.prisma,
  ): Promise<number> {
    await db.sequenceCounter.upsert({
      where: { key },
      update: {},
      create: { key, value: 0 },
    });

    const next = await db.sequenceCounter.update({
      where: { key },
      data: {
        value: {
          increment: 1,
        },
      },
      select: {
        value: true,
      },
    });

    return next.value;
  }

  async formatSupportTicketNumber(db: DbClient = this.prisma): Promise<string> {
    const sequence = await this.nextCounterValue(PLATFORM_COUNTER_KEYS.supportTickets, db);
    return `SUP-${String(sequence).padStart(5, '0')}`;
  }

  private readNumber(
    values: Map<string, Prisma.JsonValue>,
    key: PlatformSettingKey,
  ): number {
    const value = values.get(key);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return PLATFORM_SETTINGS_DEFAULTS[key as keyof PlatformSettings] as number;
  }

  private readOnboardingFeeModel(values: Map<string, Prisma.JsonValue>): OnboardingFeeModel {
    const value = values.get(PLATFORM_SETTING_KEYS.onboardingFeeModel);
    if (value === OnboardingFeeModel.UPFRONT || value === OnboardingFeeModel.FIRST_BOOKING_DEDUCTION) {
      return value;
    }
    return PLATFORM_SETTINGS_DEFAULTS.onboardingFeeModel;
  }

  private getDescription(key: PlatformSettingKey): string {
    switch (key) {
      case PLATFORM_SETTING_KEYS.maxPrelaunchPoolSize:
        return 'Maximum number of artist applications auto-routed into the prelaunch pool.';
      case PLATFORM_SETTING_KEYS.liveArtistSlotLimit:
        return 'Maximum number of artist profiles allowed to be live in the current rollout wave.';
      case PLATFORM_SETTING_KEYS.onboardingFeeModel:
        return 'Switch between upfront onboarding fees and first-booking deduction.';
      case PLATFORM_SETTING_KEYS.normalCommissionRate:
        return 'Base platform commission percentage for artists after onboarding recovery.';
      case PLATFORM_SETTING_KEYS.temporaryFirstBookingCommissionRate:
        return 'Temporary commission percentage used to recover onboarding cost on the first completed booking.';
      case PLATFORM_SETTING_KEYS.disputeWindowDays:
        return 'Default number of days clients can open a standard dispute after completion approval.';
      case PLATFORM_SETTING_KEYS.bookingStartCodeLength:
        return 'Number of digits in the client safety verification code.';
      case PLATFORM_SETTING_KEYS.startCodeActivationHours:
        return 'Hours before the booking start when the booking moves into the awaiting-start-code stage.';
      case PLATFORM_SETTING_KEYS.clientApprovalGraceHours:
        return 'Hours after artist completion before the booking auto-moves into the completed state.';
      default:
        return 'Platform configuration setting.';
    }
  }
}
