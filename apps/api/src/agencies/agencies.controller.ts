import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Agency } from '@vendorapp/shared';
import { AllowIncompleteOnboarding } from '../auth/allow-incomplete-onboarding.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { OnboardingCompleteGuard } from '../auth/onboarding-complete.guard';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { AgenciesService } from './agencies.service';

type AuthRequest = {
  auth: {
    userId: string;
  };
};

@Controller('agencies')
@UseGuards(AuthGuard, OnboardingCompleteGuard)
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Get('me')
  async findMyAgency(@Req() request: AuthRequest): Promise<Agency | null> {
    return this.agenciesService.findMyAgency(request.auth.userId);
  }

  @Post()
  @AllowIncompleteOnboarding()
  async createAgency(
    @Req() request: AuthRequest,
    @Body() input: CreateAgencyDto,
  ): Promise<Agency> {
    return this.agenciesService.createForOwner(request.auth.userId, input);
  }
}
