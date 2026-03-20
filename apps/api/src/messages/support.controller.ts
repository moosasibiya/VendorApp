import { Body, Controller, Param, Patch, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { ApiResponse, ConversationSummary } from '@vendorapp/shared';
import { AllowIncompleteOnboarding } from '../auth/allow-incomplete-onboarding.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { OnboardingCompleteGuard } from '../auth/onboarding-complete.guard';
import { ConversationIdParamDto } from './dto/conversation-id-param.dto';
import { CreateSupportThreadDto } from './dto/create-support-thread.dto';
import { UpdateSupportThreadDto } from './dto/update-support-thread.dto';
import { MessagesService } from './messages.service';

type AuthenticatedRequest = {
  auth?: {
    userId: string;
  };
};

@Controller('support')
@UseGuards(AuthGuard, OnboardingCompleteGuard)
@AllowIncompleteOnboarding()
export class SupportController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('threads')
  async createSupportThread(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateSupportThreadDto,
  ): Promise<ApiResponse<ConversationSummary>> {
    return this.messagesService.createSupportConversation(this.getUserId(request), input);
  }

  @Patch('threads/:id')
  async updateSupportThread(
    @Req() request: AuthenticatedRequest,
    @Param() params: ConversationIdParamDto,
    @Body() input: UpdateSupportThreadDto,
  ): Promise<ApiResponse<ConversationSummary>> {
    return this.messagesService.updateSupportThread(this.getUserId(request), params.id, input);
  }

  private getUserId(request: AuthenticatedRequest): string {
    const userId = request.auth?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user context missing');
    }
    return userId;
  }
}
