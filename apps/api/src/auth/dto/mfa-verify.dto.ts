import { IsOptional, IsString, Matches } from 'class-validator';

export class MfaVerifyDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'mfaCode must be a 6-digit code' })
  mfaCode?: string;

  @IsOptional()
  @IsString()
  backupCode?: string;
}
