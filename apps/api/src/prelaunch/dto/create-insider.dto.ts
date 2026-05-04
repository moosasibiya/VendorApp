import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const USER_TYPES = ['CLIENT', 'ARTIST'] as const;

function cleanString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export class CreateInsiderDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Transform(({ value }) => cleanString(value))
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Transform(({ value }) => cleanString(value))
  lastName!: string;

  @IsEmail()
  @MaxLength(320)
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim().toLowerCase() : undefined,
  )
  email!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(32)
  @Transform(({ value }) => cleanString(value))
  phoneNumber!: string;

  @IsIn(USER_TYPES)
  userType!: (typeof USER_TYPES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }): string | undefined =>
    cleanString(value)?.toUpperCase(),
  )
  referredBy?: string;
}
