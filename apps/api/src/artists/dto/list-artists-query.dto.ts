import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const ARTIST_SORT_VALUES = ['rating', 'rate_asc', 'rate_desc', 'newest'] as const;

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }
  return undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const normalized = value
      .flatMap((item) => (typeof item === 'string' ? item.split(',') : []))
      .map((item) => item.trim())
      .filter(Boolean);
    return normalized.length > 0 ? Array.from(new Set(normalized)) : undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return normalized.length > 0 ? Array.from(new Set(normalized)) : undefined;
}

export class ListArtistsQueryDto {
  @IsOptional()
  @Transform(({ value }) => toOptionalString(value))
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => toOptionalString(value))
  @IsString()
  location?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minRate?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxRate?: number;

  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) => toOptionalString(value))
  @IsString()
  q?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;

  @IsOptional()
  @Transform(({ value }) => toOptionalString(value) ?? 'rating')
  @IsIn(ARTIST_SORT_VALUES)
  sortBy: (typeof ARTIST_SORT_VALUES)[number] = 'rating';
}
