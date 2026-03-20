import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const artistApplicationActions = ['under_review', 'approve', 'reject', 'go_live'] as const;

export class UpdateArtistApplicationDto {
  @IsString()
  @IsIn(artistApplicationActions)
  action!: (typeof artistApplicationActions)[number];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
