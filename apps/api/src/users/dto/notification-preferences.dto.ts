import { IsBoolean, IsOptional } from 'class-validator';

export class NotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  bookingUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  newMessages?: boolean;

  @IsOptional()
  @IsBoolean()
  marketing?: boolean;
}
