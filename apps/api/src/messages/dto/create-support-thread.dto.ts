import { IsOptional, IsString, MinLength } from 'class-validator';
import { SupportCategory } from '@vendorapp/shared';
import { IsEnum } from 'class-validator';

export class CreateSupportThreadDto {
  @IsEnum(SupportCategory)
  category!: SupportCategory;

  @IsString()
  @MinLength(3)
  subject!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  initialMessage?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  bookingId?: string;
}
