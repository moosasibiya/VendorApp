import type { CurrentBookingStatus } from '../enums';

export interface Booking {
  id: string;
  artistName: string;
  artistInitials: string;
  status: CurrentBookingStatus;
  title: string;
  location: string;
  date: string;
  amount: string;
  applications: number;
}
