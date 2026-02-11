import type { AccountType } from '@vendorapp/shared';

export interface StoredUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  emailNormalized: string;
  accountType: AccountType;
  createdAt: string;
  passwordSalt: string;
  passwordHash: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}
