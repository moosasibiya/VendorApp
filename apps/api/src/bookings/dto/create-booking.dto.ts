import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  artistName!: string;

  @IsString()
  @Matches(/^[A-Z]{1,3}$/, {
    message: 'artistInitials must be 1-3 uppercase letters',
  })
  artistInitials!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  amount!: string;
}
