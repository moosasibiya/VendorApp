import { IsNotEmpty, IsString } from 'class-validator';

export class BookingIdParamDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}
