import { Body, Controller, Delete, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { DashboardStats, UpcomingBookingItem, User } from '@vendorapp/shared';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateClientOnboardingDto } from './dto/update-client-onboarding.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type AuthRequest = {
  auth: {
    userId: string;
  };
};

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/stats')
  async getMyStats(@Req() request: AuthRequest): Promise<DashboardStats> {
    return this.usersService.getStats(request.auth.userId);
  }

  @Get('me/upcoming-bookings')
  async getUpcomingBookings(@Req() request: AuthRequest): Promise<UpcomingBookingItem[]> {
    return this.usersService.getUpcomingBookings(request.auth.userId);
  }

  @Patch('me')
  async updateMe(
    @Req() request: AuthRequest,
    @Body() input: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateMe(request.auth.userId, input);
  }

  @Patch('me/onboarding/client')
  async updateClientOnboarding(
    @Req() request: AuthRequest,
    @Body() input: UpdateClientOnboardingDto,
  ): Promise<User> {
    return this.usersService.updateClientOnboarding(request.auth.userId, input);
  }

  @Delete('me')
  async deleteMe(@Req() request: AuthRequest): Promise<{ success: true }> {
    return this.usersService.deactivateMe(request.auth.userId);
  }
}
