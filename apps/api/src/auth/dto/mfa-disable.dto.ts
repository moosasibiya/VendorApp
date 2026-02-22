import { IsOptional, IsString, Matches } from 'class-validator';

export class MfaDisableDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'mfaCode must be a 6-digit code' })
  mfaCode?: string;

  @IsOptional()
  @IsString()
  backupCode?: string;

  // Backward-compatible alias for existing clients.
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be a 6-digit code' })
  code?: string;
}
