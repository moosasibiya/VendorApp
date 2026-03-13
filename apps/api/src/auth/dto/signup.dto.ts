import { IsEmail, IsIn, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ACCOUNT_TYPE_VALUES, type AccountType } from '@vendorapp/shared';
import {
  PASSWORD_LETTER_MESSAGE,
  PASSWORD_LETTER_REGEX,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_LENGTH_MESSAGE,
  PASSWORD_NUMBER_MESSAGE,
  PASSWORD_NUMBER_REGEX,
} from '../password-policy';

const accountTypes = [...ACCOUNT_TYPE_VALUES] satisfies AccountType[];

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,30}$/, {
    message: 'username must be 3-30 chars and only letters, numbers, underscore',
  })
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_MIN_LENGTH_MESSAGE })
  @Matches(PASSWORD_LETTER_REGEX, { message: PASSWORD_LETTER_MESSAGE })
  @Matches(PASSWORD_NUMBER_REGEX, { message: PASSWORD_NUMBER_MESSAGE })
  password!: string;

  @IsIn(accountTypes)
  accountType!: AccountType;
}
