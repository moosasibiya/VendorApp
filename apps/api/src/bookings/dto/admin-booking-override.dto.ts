import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const bookingOverrideActions = [
  'verify_without_code',
  'hold_payout',
  'release_payout',
  'resolve_dispute',
] as const;

export class AdminBookingOverrideDto {
  @IsString()
  @IsIn(bookingOverrideActions)
  action!: (typeof bookingOverrideActions)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
