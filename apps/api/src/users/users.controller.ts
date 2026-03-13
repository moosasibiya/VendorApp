import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import type { User } from '@vendorapp/shared';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateClientOnboardingDto } from './dto/update-client-onboarding.dto';
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

  @Patch('me/onboarding/client')
  async updateClientOnboarding(
    @Req() request: AuthRequest,
    @Body() input: UpdateClientOnboardingDto,
  ): Promise<User> {
    return this.usersService.updateClientOnboarding(request.auth.userId, input);
  }
}
