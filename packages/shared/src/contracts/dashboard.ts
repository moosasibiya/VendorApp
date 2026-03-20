import type { PaymentStatusValue, UserRoleValue } from '../enums';

export interface DashboardStatsBase {
  role: UserRoleValue;
}

export interface ClientDashboardStats extends DashboardStatsBase {
  role: 'CLIENT';
  totalBookings: number;
  upcomingBookings: number;
  totalSpent: number;
  favouriteArtists: number;
}

export interface ArtistDashboardStats extends DashboardStatsBase {
  role: 'ARTIST';
  totalBookings: number;
  pendingBookings: number;
  totalEarned: number;
  averageRating: number;
  totalReviews: number;
  profileViews: number;
}

export interface AgencyDashboardStats extends DashboardStatsBase {
  role: 'AGENCY';
  totalArtists: number;
  activeBookings: number;
  totalRevenue: number;
}

export interface AdminDashboardStats extends DashboardStatsBase {
  role: 'ADMIN' | 'SUB_ADMIN';
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
}

export type DashboardStats =
  | ClientDashboardStats
  | ArtistDashboardStats
  | AgencyDashboardStats
  | AdminDashboardStats;

export interface UpcomingBookingItem {
  id: string;
  title: string;
  eventDate: string;
  location: string;
  status: string;
  paymentStatus: PaymentStatusValue;
  totalAmount: number;
  counterpartName: string;
  counterpartAvatarUrl?: string | null;
  artistSlug?: string | null;
}
