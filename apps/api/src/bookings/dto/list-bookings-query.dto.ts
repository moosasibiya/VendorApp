import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, Max, Min } from 'class-validator';
import { BookingStatus } from '@vendorapp/shared';

export class ListBookingsQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Type(() => Number)
  @Min(1)
  page = 1;

  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit = 20;
}
