import { BadRequestException, Injectable } from '@nestjs/common';
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
    return bookings.map((booking) => this.toBookingResponse(booking));
  }

  async create(userId: string, input: CreateBookingDto): Promise<Booking> {
    const artist = await this.findArtistForRequest(input);
    const totalAmount = this.parseCurrencyAmount(input.amount);
    const platformFeePercent = this.getPlatformFeePercent();
    const platformFee = Number((totalAmount * platformFeePercent).toFixed(2));
    const artistPayout = Number((totalAmount - platformFee).toFixed(2));
    const eventDate = this.parseEventDate(input.date);

    const booking = await this.prisma.booking.create({
      data: {
        id: `bk-${randomBytes(8).toString('hex')}`,
        clientId: userId,
        artistId: artist.id,
        artistName: input.artistName,
        artistInitials: input.artistInitials,
        status: PrismaBookingStatus.PENDING,
        title: input.title,
        description: input.description?.trim() || input.title.trim(),
        eventDate,
        location: input.location,
        totalAmount: totalAmount.toFixed(2),
        platformFee: platformFee.toFixed(2),
        artistPayout: artistPayout.toFixed(2),
        date: input.date,
        amount: input.amount,
        applications: 0,
      },
    });

    return this.toBookingResponse(booking);
  }

  private async findArtistForRequest(input: CreateBookingDto): Promise<{
    id: string;
    slug: string;
    displayName: string;
    name: string;
  }> {
    if (input.artistSlug?.trim()) {
      const artistBySlug = await this.prisma.artist.findUnique({
        where: { slug: input.artistSlug.trim() },
        select: {
          id: true,
          slug: true,
          displayName: true,
          name: true,
        },
      });
      if (artistBySlug) {
        return artistBySlug;
      }
    }

    const artistByName = await this.prisma.artist.findFirst({
      where: {
        OR: [
          { displayName: { equals: input.artistName.trim(), mode: 'insensitive' } },
          { name: { equals: input.artistName.trim(), mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        slug: true,
        displayName: true,
        name: true,
      },
    });

    if (!artistByName) {
      throw new BadRequestException('Artist not found for booking request');
    }

    return artistByName;
  }

  private parseEventDate(value: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('date must be a valid date');
    }
    return parsed;
  }

  private parseCurrencyAmount(value: string): number {
    const normalized = value.replace(/[^\d.,-]/g, '').replace(/,/g, '');
    const amount = Number.parseFloat(normalized);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a valid currency value');
    }
    return amount;
  }

  private getPlatformFeePercent(): number {
    const raw = Number.parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? '10');
    if (!Number.isFinite(raw) || raw < 0) {
      return 0.1;
    }
    return raw / 100;
  }

  private toLegacyStatus(status: PrismaBookingStatus): Booking['status'] {
    switch (status) {
      case PrismaBookingStatus.PENDING:
        return 'Pending';
      case PrismaBookingStatus.CONFIRMED:
      case PrismaBookingStatus.IN_PROGRESS:
        return 'Confirmed';
      case PrismaBookingStatus.COMPLETED:
        return 'Completed';
      case PrismaBookingStatus.CANCELLED:
      case PrismaBookingStatus.DISPUTED:
      default:
        return 'Cancelled';
    }
  }

  private toBookingResponse(booking: {
    id: string;
    artistName: string;
    artistInitials: string;
    status: PrismaBookingStatus;
    title: string;
    location: string;
    date: string;
    amount: string;
    applications: number;
  }): Booking {
    return {
      id: booking.id,
      artistName: booking.artistName,
      artistInitials: booking.artistInitials,
      status: this.toLegacyStatus(booking.status),
      title: booking.title,
      location: booking.location,
      date: booking.date,
      amount: booking.amount,
      applications: booking.applications,
    };
  }
}
