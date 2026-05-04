import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { CreateInsiderDto } from './dto/create-insider.dto';
import { CreatePrelaunchLeadDto } from './dto/create-prelaunch-lead.dto';
import { PrelaunchService } from './prelaunch.service';

type RequestWithMeta = {
  ip?: string;
  headers: {
    'user-agent'?: string;
  };
};

@Controller('prelaunch')
export class PrelaunchController {
  constructor(private readonly prelaunchService: PrelaunchService) {}

  @Post('leads')
  async createLead(
    @Body() input: CreatePrelaunchLeadDto,
    @Req() req: RequestWithMeta,
  ) {
    const lead = await this.prelaunchService.createLead(input, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return {
      data: lead,
      message: 'You are on the Vendr Studios launch list.',
    };
  }

  @Post('insiders')
  async createInsider(
    @Body() input: CreateInsiderDto,
    @Req() req: RequestWithMeta,
  ) {
    const insider = await this.prelaunchService.createInsider(input, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return {
      data: insider,
      message: insider.duplicate
        ? 'You are already in the VendrStudio Insider Programme.'
        : 'You joined the VendrStudio Insider Programme.',
    };
  }

  @Get('referrals/:code')
  async getReferral(@Param('code') code: string) {
    return {
      data: await this.prelaunchService.findReferral(code),
    };
  }
}
