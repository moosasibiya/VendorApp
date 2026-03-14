import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  bookingId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  participantId?: string;
}
