import type { AccountType } from '@vendorapp/shared';

export interface StoredUser {
  id: string;
  fullName: string;
  username: string;
  usernameNormalized: string;
  email: string;
  emailNormalized: string;
  accountType: AccountType;
  createdAt: string;
  passwordSalt: string;
  passwordHash: string;
  passwordResetHash?: string | null;
  passwordResetExpiry?: string | null;
  mfaEnabled?: boolean;
  mfaSecret?: string | null;
  mfaTempSecret?: string | null;
  mfaBackupCodeHashes?: string[] | null;
  failedLoginAttempts?: number;
  lockoutUntil?: string | null;
  tokenVersion?: number;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  ver: number;
  iat: number;
  exp: number;
}
