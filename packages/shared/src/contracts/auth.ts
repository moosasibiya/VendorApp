import type { AccountType } from '../enums';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  accountType: AccountType;
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
}
