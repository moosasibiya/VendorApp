import { Injectable } from '@nestjs/common';
import type { Booking } from '@vendorapp/shared';
import type { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  private readonly bookings: Booking[] = [
    {
      id: 'bk-1',
      artistName: 'Ayanda Khumalo',
      artistInitials: 'AK',
      status: 'Pending',
      title: 'Wedding shoot',
      location: 'Cape Town',
      date: '12 Aug 2025',
      amount: 'R12,000',
      applications: 3,
    },
    {
      id: 'bk-2',
      artistName: 'Nandi Mokoena',
      artistInitials: 'NM',
      status: 'Confirmed',
      title: 'Brand campaign',
      location: 'Johannesburg',
      date: '18 Aug 2025',
      amount: 'R18,500',
      applications: 5,
    },
    {
      id: 'bk-3',
      artistName: 'Themba Dlamini',
      artistInitials: 'TD',
      status: 'Completed',
      title: 'Corporate portraits',
      location: 'Pretoria',
      date: '01 Aug 2025',
      amount: 'R9,800',
      applications: 2,
    },
  ];

  findAll(): Booking[] {
    return this.bookings;
  }

  create(input: CreateBookingDto): Booking {
    const nextId = `bk-${this.bookings.length + 1}`;
    const booking: Booking = {
      id: nextId,
      artistName: input.artistName,
      artistInitials: input.artistInitials,
      status: 'Pending',
      title: input.title,
      location: input.location,
      date: input.date,
      amount: input.amount,
      applications: 0,
    };

    this.bookings.unshift(booking);
    return booking;
  }
}
