import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(12, { message: 'password must be at least 12 characters' })
  @Matches(/[a-z]/, { message: 'password must include a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'password must include an uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must include a number' })
  @Matches(/[^A-Za-z0-9]/, { message: 'password must include a special character' })
  newPassword!: string;
}
