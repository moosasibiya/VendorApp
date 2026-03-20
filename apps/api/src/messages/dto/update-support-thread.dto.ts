import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsEnum } from 'class-validator';
import { SupportThreadStatus } from '@vendorapp/shared';

export class UpdateSupportThreadDto {
  @IsOptional()
  @IsEnum(SupportThreadStatus)
  status?: SupportThreadStatus;

  @IsOptional()
  @IsString()
  assignedAdminUserId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNote?: string | null;
}
