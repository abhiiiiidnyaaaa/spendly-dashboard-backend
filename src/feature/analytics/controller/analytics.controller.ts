import { Controller, Get, HttpStatus, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AnalyticsService } from '../application/services/analytics.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController extends BaseController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly responseService: ResponseService,
  ) {
    super();
  }

  @Get('summary')
  async getSummary(@Req() req: Request, @Res() res: Response) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const data = await this.analyticsService.getSummary(userId);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Summary retrieved successfully');
    }, 'Error fetching summary analytics');
  }

  @Get('category-breakdown')
  async getCategoryBreakdown(@Req() req: Request, @Res() res: Response) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const data = await this.analyticsService.getCategoryBreakdown(userId);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Breakdown retrieved successfully');
    }, 'Error fetching category breakdown');
  }

  @Get('monthly-trend')
  async getMonthlyTrend(@Req() req: Request, @Res() res: Response) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const data = await this.analyticsService.getMonthlyTrend(userId);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Monthly trend retrieved successfully');
    }, 'Error fetching monthly trend');
  }
}
