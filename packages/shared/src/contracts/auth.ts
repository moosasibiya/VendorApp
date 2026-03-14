import type { AccountType, UserRoleValue } from '../enums';
import type { UserNotificationPreferences } from './users';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  accountType: AccountType;
  role: UserRoleValue;
  avatarUrl?: string | null;
  location?: string | null;
  clientEventTypes?: string[];
  clientBudgetMin?: number | null;
  clientBudgetMax?: number | null;
  notificationPreferences?: UserNotificationPreferences | null;
  isEmailVerified?: boolean;
  isActive?: boolean;
  onboardingCompleted?: boolean;
  createdAt: string;
}

export interface SignupRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
  accountType: AccountType;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  nextPath?: string;
  requiresEmailVerification?: boolean;
  verificationEmailSent?: boolean;
}
