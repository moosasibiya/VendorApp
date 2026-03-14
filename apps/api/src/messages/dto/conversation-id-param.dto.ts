import { IsString, MinLength } from 'class-validator';

export class ConversationIdParamDto {
  @IsString()
  @MinLength(1)
  id!: string;
}
