import type { AccountType, UserRoleValue } from '@vendorapp/shared';

export interface StoredUser {
  id: string;
  fullName: string;
  username: string;
  usernameNormalized: string;
  email: string;
  emailNormalized: string;
  accountType: AccountType;
  role: UserRoleValue;
  avatarUrl?: string | null;
  location?: string | null;
  clientEventTypes?: string[];
  clientBudgetMin?: string | null;
  clientBudgetMax?: string | null;
  isEmailVerified?: boolean;
  isActive?: boolean;
  onboardingCompletedAt?: string | null;
  googleId?: string | null;
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

export interface EmailVerificationTokenPayload {
  sub: string;
  email: string;
  purpose: 'email_verification';
  iat: number;
  exp: number;
}
