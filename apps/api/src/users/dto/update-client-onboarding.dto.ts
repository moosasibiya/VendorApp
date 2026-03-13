import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateClientOnboardingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string | null;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  location!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(40, { each: true })
  eventTypes!: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMin?: number | null;

  @ValidateIf((value: UpdateClientOnboardingDto) => value.budgetMax !== null && value.budgetMax !== undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMax?: number | null;
}
