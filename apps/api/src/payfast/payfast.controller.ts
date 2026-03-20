import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { ApiResponse, PaymentCheckoutSession } from '@vendorapp/shared';
import { AuthGuard } from '../auth/auth.guard';
import { OnboardingCompleteGuard } from '../auth/onboarding-complete.guard';
import { BookingIdParamDto } from '../bookings/dto/booking-id-param.dto';
import { PayfastService } from './payfast.service';
import { PayfastItnDto } from './dto/payfast-itn.dto';

type RequestWithBody = {
  body: Record<string, string | string[] | undefined>;
  ip?: string | null;
  auth?: {
    userId: string;
  };
};

@Controller()
export class PayfastController {
  constructor(private readonly payfastService: PayfastService) {}

  @Post('bookings/:id/payment/initiate')
  @UseGuards(AuthGuard, OnboardingCompleteGuard)
  async initiatePayment(
    @Req() request: RequestWithBody,
    @Param() params: BookingIdParamDto,
  ): Promise<ApiResponse<PaymentCheckoutSession>> {
    return this.payfastService.initiateBookingPayment(this.getUserId(request), params.id);
  }

  @Post('payfast/notify')
  @HttpCode(200)
  async notify(
    @Body() payload: PayfastItnDto,
    @Req() request: RequestWithBody,
  ): Promise<string> {
    await this.payfastService.handleNotification(payload, request.body, request.ip ?? null);
    return 'OK';
  }

  private getUserId(request: RequestWithBody): string {
    const userId = request.auth?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user context missing');
    }
    return userId;
  }
}
