import { IsString, Length } from 'class-validator';

export class VerifyBookingStartCodeDto {
  @IsString()
  @Length(4, 12)
  code!: string;
}
