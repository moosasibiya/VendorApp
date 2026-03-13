import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpsertArtistProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  role!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  location!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(600)
  bio!: string;

  @IsArray()
  @ArrayMaxSize(6)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  services!: string[];

  @IsArray()
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  specialties!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  pricingSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  availabilitySummary?: string;

  @IsArray()
  @ArrayMaxSize(6)
  @ArrayUnique()
  @IsUrl(
    { require_protocol: true },
    { each: true, message: 'portfolioLinks must contain valid URLs' },
  )
  portfolioLinks!: string[];
}
