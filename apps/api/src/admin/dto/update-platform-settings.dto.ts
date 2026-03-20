import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { OnboardingFeeModel } from '@vendorapp/shared';
import { IsEnum } from 'class-validator';

export class UpdatePlatformSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPrelaunchPoolSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  liveArtistSlotLimit?: number;

  @IsOptional()
  @IsEnum(OnboardingFeeModel)
  onboardingFeeModel?: OnboardingFeeModel;

  @IsOptional()
  @IsNumber()
  @Min(0)
  normalCommissionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  temporaryFirstBookingCommissionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  disputeWindowDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(4)
  bookingStartCodeLength?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  startCodeActivationHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  clientApprovalGraceHours?: number;
}
