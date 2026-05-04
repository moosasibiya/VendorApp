import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateInsiderDto {
  @IsOptional()
  @IsBoolean()
  instagramFollowed?: boolean;

  @IsOptional()
  @IsBoolean()
  tiktokFollowed?: boolean;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}
