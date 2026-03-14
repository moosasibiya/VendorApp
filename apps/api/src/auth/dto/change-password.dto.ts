import { IsString, Matches, MinLength } from 'class-validator';
import {
  PASSWORD_LETTER_MESSAGE,
  PASSWORD_LETTER_REGEX,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_NUMBER_MESSAGE,
  PASSWORD_NUMBER_REGEX,
} from '../password-policy';

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MIN_LENGTH_MESSAGE })
  @Matches(PASSWORD_LETTER_REGEX, { message: PASSWORD_LETTER_MESSAGE })
  @Matches(PASSWORD_NUMBER_REGEX, { message: PASSWORD_NUMBER_MESSAGE })
  newPassword!: string;
}
