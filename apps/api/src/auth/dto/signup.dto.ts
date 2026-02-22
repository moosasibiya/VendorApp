import { IsEmail, IsIn, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import type { AccountType } from '@vendorapp/shared';

const accountTypes: AccountType[] = ['CREATIVE', 'CLIENT', 'AGENCY'];

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
  @MinLength(12, { message: 'password must be at least 12 characters' })
  @Matches(/[a-z]/, { message: 'password must include a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'password must include an uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must include a number' })
  @Matches(/[^A-Za-z0-9]/, { message: 'password must include a special character' })
  password!: string;

  @IsIn(accountTypes)
  accountType!: AccountType;
}
