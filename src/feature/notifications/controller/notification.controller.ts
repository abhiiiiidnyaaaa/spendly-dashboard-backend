import { Controller, Get, Patch, Param, Query, UseGuards, Req, HttpStatus, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { NotificationService } from '../application/services/notification.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController extends BaseController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly responseService: ResponseService,
  ) {
    super();
  }

  @Get()
  async findAll(@Req() req: any, @Query('limit') limit: string, @Res() res: Response) {
    await this.handleRequest(async () => {
      const data = await this.notificationService.getUserNotifications(
        req.user.id,
        limit ? parseInt(limit, 10) : 20,
      );
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Notifications retrieved');
    }, 'Failed to retrieve notifications');
  }

  @Get('unread-count')
  async unreadCount(@Req() req: any, @Res() res: Response) {
    await this.handleRequest(async () => {
      const count = await this.notificationService.getUnreadCount(req.user.id);
      this.responseService.sendResponse(res, HttpStatus.OK, { count }, 'Unread count retrieved');
    }, 'Failed to get unread count');
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    await this.handleRequest(async () => {
      const data = await this.notificationService.markAsRead(req.user.id, id);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Notification marked as read');
    }, 'Failed to mark notification as read');
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: any, @Res() res: Response) {
    await this.handleRequest(async () => {
      await this.notificationService.markAllAsRead(req.user.id);
      this.responseService.sendResponse(res, HttpStatus.OK, null, 'All notifications marked as read');
    }, 'Failed to mark all as read');
  }
}
