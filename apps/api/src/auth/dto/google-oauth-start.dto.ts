import { IsIn, IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { ACCOUNT_TYPE_VALUES, type AccountType } from '@vendorapp/shared';

const accountTypes = [...ACCOUNT_TYPE_VALUES] satisfies AccountType[];

export class GoogleOauthStartDto {
  @IsOptional()
  @IsString()
  @IsIn(['login', 'signup'])
  mode?: 'login' | 'signup';

  @IsOptional()
  @IsString()
  @Matches(/^\/(?!\/).*/, {
    message: 'next must be an application-relative path beginning with /',
  })
  @MaxLength(256)
  next?: string;

  @IsOptional()
  @IsIn(accountTypes)
  accountType?: AccountType;
}
