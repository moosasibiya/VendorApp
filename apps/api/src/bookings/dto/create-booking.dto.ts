import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  artistId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @IsDateString()
  eventDate!: string;

  @IsOptional()
  @IsDateString()
  eventEndDate?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  location!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
