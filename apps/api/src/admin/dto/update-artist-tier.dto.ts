import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateArtistTierDto {
  @IsOptional()
  @IsString()
  tierId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;
}
