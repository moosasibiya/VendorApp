import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { ApiResponse, Booking } from '@vendorapp/shared';
import { AuthGuard } from '../auth/auth.guard';
import { OnboardingCompleteGuard } from '../auth/onboarding-complete.guard';
import { BookingsService } from './bookings.service';
import { AdminBookingOverrideDto } from './dto/admin-booking-override.dto';
import { BookingIdParamDto } from './dto/booking-id-param.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { VerifyBookingStartCodeDto } from './dto/verify-booking-start-code.dto';

type AuthenticatedRequest = {
  auth?: {
    userId: string;
  };
};

@Controller('bookings')
@UseGuards(AuthGuard, OnboardingCompleteGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListBookingsQueryDto,
  ): Promise<ApiResponse<Booking[]>> {
    return this.bookingsService.findAll(this.getUserId(request), query);
  }

  @Get(':id')
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param() params: BookingIdParamDto,
  ): Promise<ApiResponse<Booking>> {
    return this.bookingsService.findOne(this.getUserId(request), params.id);
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateBookingDto,
  ): Promise<ApiResponse<Booking>> {
    return this.bookingsService.create(this.getUserId(request), input);
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param() params: BookingIdParamDto,
    @Body() input: UpdateBookingStatusDto,
  ): Promise<ApiResponse<Booking>> {
    return this.bookingsService.updateStatus(this.getUserId(request), params.id, input);
  }

  @Post(':id/start-code/verify')
  async verifyStartCode(
    @Req() request: AuthenticatedRequest,
    @Param() params: BookingIdParamDto,
    @Body() input: VerifyBookingStartCodeDto,
  ): Promise<ApiResponse<Booking>> {
    return this.bookingsService.verifyStartCode(this.getUserId(request), params.id, input.code);
  }

  @Patch(':id/admin-override')
  async applyAdminOverride(
    @Req() request: AuthenticatedRequest,
    @Param() params: BookingIdParamDto,
    @Body() input: AdminBookingOverrideDto,
  ): Promise<ApiResponse<Booking>> {
    return this.bookingsService.applyAdminOverride(this.getUserId(request), params.id, input);
  }

  private getUserId(request: AuthenticatedRequest): string {
    const userId = request.auth?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user context missing');
    }
    return userId;
  }
}
