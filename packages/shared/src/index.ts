export const sharedHello = "VendorApp shared package ready";

export type UserRole = "VENDOR" | "ORGANIZER" | "ADMIN";

export interface Artist {
  name: string;
  role: string;
  location: string;
  rating: string;
  slug: string;
}

export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

export interface Booking {
  id: string;
  artistName: string;
  artistInitials: string;
  status: BookingStatus;
  title: string;
  location: string;
  date: string;
  amount: string;
  applications: number;
}

export type AccountType = "CREATIVE" | "CLIENT" | "AGENCY";

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
  token: string;
  user: User;
}
