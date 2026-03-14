import { Controller, Get, Param, Patch, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { NotificationFeed, NotificationItem } from '@vendorapp/shared';
import { AuthGuard } from '../auth/auth.guard';
import { NotificationIdParamDto } from './dto/notification-id-param.dto';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

type AuthenticatedRequest = {
  auth?: {
    userId: string;
  };
};

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationFeed> {
    return this.notificationsService.listForUser(this.getUserId(request), query);
  }

  @Patch(':id/read')
  async markRead(
    @Req() request: AuthenticatedRequest,
    @Param() params: NotificationIdParamDto,
  ): Promise<NotificationItem> {
    return this.notificationsService.markRead(this.getUserId(request), params.id);
  }

  @Patch('read-all')
  async markAllRead(@Req() request: AuthenticatedRequest): Promise<{ success: true }> {
    return this.notificationsService.markAllRead(this.getUserId(request));
  }

  private getUserId(request: AuthenticatedRequest): string {
    const userId = request.auth?.userId;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user context missing');
    }
    return userId;
  }
}
