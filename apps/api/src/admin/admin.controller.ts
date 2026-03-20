import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { AdminDashboardData, PlatformSettings } from '@vendorapp/shared';
import { AuthGuard } from '../auth/auth.guard';
import { AdminService } from './admin.service';
import { UpdateArtistApplicationDto } from './dto/update-artist-application.dto';
import { UpdateArtistTierDefinitionDto } from './dto/update-artist-tier-definition.dto';
import { UpdateArtistTierDto } from './dto/update-artist-tier.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

type AuthenticatedRequest = {
  auth?: {
    userId: string;
  };
};

@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard(@Req() request: AuthenticatedRequest): Promise<AdminDashboardData> {
    return this.adminService.getDashboard(this.getUserId(request));
  }

  @Patch('settings')
  async updateSettings(
    @Req() request: AuthenticatedRequest,
    @Body() input: UpdatePlatformSettingsDto,
  ): Promise<PlatformSettings> {
    return this.adminService.updateSettings(this.getUserId(request), input);
  }

  @Patch('artists/:artistId/application')
  async updateArtistApplication(
    @Req() request: AuthenticatedRequest,
    @Param('artistId') artistId: string,
    @Body() input: UpdateArtistApplicationDto,
  ): Promise<AdminDashboardData> {
    return this.adminService.updateArtistApplication(this.getUserId(request), artistId, input);
  }

  @Patch('artists/:artistId/tier')
  async updateArtistTier(
    @Req() request: AuthenticatedRequest,
    @Param('artistId') artistId: string,
    @Body() input: UpdateArtistTierDto,
  ): Promise<AdminDashboardData> {
    return this.adminService.updateArtistTier(this.getUserId(request), artistId, input);
  }

  @Patch('tiers/:tierId')
  async updateTierDefinition(
    @Req() request: AuthenticatedRequest,
    @Param('tierId') tierId: string,
    @Body() input: UpdateArtistTierDefinitionDto,
  ): Promise<AdminDashboardData> {
    return this.adminService.updateTierDefinition(this.getUserId(request), tierId, input);
  }

  private getUserId(request: AuthenticatedRequest): string {
    const userId = request.auth?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user context missing');
    }
    return userId;
  }
}
