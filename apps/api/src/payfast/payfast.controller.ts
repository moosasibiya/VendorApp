import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { PayfastService } from './payfast.service';
import { PayfastItnDto } from './dto/payfast-itn.dto';

type RequestWithBody = {
  body: Record<string, string | string[] | undefined>;
  ip?: string | null;
};

@Controller('payfast')
export class PayfastController {
  constructor(private readonly payfastService: PayfastService) {}

  @Post('notify')
  @HttpCode(200)
  async notify(
    @Body() payload: PayfastItnDto,
    @Req() request: RequestWithBody,
  ): Promise<string> {
    await this.payfastService.handleNotification(payload, request.body, request.ip ?? null);
    return 'OK';
  }
}
