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
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password!: string;

  @IsIn(accountTypes)
  accountType!: AccountType;
}
