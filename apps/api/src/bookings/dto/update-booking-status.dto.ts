import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { BOOKING_ACTION_VALUES } from '@vendorapp/shared';

export class UpdateBookingStatusDto {
  @IsString()
  @IsIn(BOOKING_ACTION_VALUES)
  action!: (typeof BOOKING_ACTION_VALUES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
