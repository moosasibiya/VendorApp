import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import type { Booking } from '@vendorapp/shared';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('bookings')
@UseGuards(AuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  findAll(): Booking[] {
    return this.bookingsService.findAll();
  }

  @Post()
  create(@Body() input: CreateBookingDto): Booking {
    return this.bookingsService.create(input);
  }
}
