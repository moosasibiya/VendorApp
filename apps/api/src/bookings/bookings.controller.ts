import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import type { Booking } from '@vendorapp/shared';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AuthGuard } from '../auth/auth.guard';

type AuthenticatedRequest = {
  auth?: {
    userId: string;
  };
};

@Controller('bookings')
@UseGuards(AuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async findAll(): Promise<Booking[]> {
    return this.bookingsService.findAll();
  }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() input: CreateBookingDto): Promise<Booking> {
    const userId = request.auth?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user context missing');
    }
    return this.bookingsService.create(userId, input);
  }
}
