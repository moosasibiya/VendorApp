import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  bookingId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  comment!: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
