import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { NotificationPreferencesDto } from './notification-preferences.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  location?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  notificationPreferences?: NotificationPreferencesDto;
}
