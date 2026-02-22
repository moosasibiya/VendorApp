import { Injectable } from '@nestjs/common';
import { BookingStatus as PrismaBookingStatus } from '@prisma/client';
import type { Booking } from '@vendorapp/shared';
import type { CreateBookingDto } from './dto/create-booking.dto';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Booking[]> {
    const bookings = await this.prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return bookings.map((booking) => ({
      id: booking.id,
      artistName: booking.artistName,
      artistInitials: booking.artistInitials,
      status: booking.status,
      title: booking.title,
      location: booking.location,
      date: booking.date,
      amount: booking.amount,
      applications: booking.applications,
    }));
  }

  async create(input: CreateBookingDto): Promise<Booking> {
    const booking = await this.prisma.booking.create({
      data: {
        id: `bk-${randomBytes(8).toString('hex')}`,
        artistName: input.artistName,
        artistInitials: input.artistInitials,
        status: PrismaBookingStatus.Pending,
        title: input.title,
        location: input.location,
        date: input.date,
        amount: input.amount,
        applications: 0,
      },
    });

    return {
      id: booking.id,
      artistName: booking.artistName,
      artistInitials: booking.artistInitials,
      status: booking.status,
      title: booking.title,
      location: booking.location,
      date: booking.date,
      amount: booking.amount,
      applications: booking.applications,
    };
  }
}
