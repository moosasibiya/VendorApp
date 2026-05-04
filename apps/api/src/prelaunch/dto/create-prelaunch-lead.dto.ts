import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const INTEREST_VALUES = ['CREATIVE', 'CLIENT', 'AGENCY', 'GENERAL'] as const;

export class CreatePrelaunchLeadDto {
  @IsEmail()
  @MaxLength(320)
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  })
  name?: string;

  @IsOptional()
  @IsIn(INTEREST_VALUES)
  interestType?: (typeof INTEREST_VALUES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string;
}
