import { Controller, Get, HttpStatus, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ReportsService } from '../application/services/reports.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController extends BaseController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly responseService: ResponseService,
  ) {
    super();
  }

  @Get('export/csv')
  @ApiQuery({ name: 'startDate', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-12-31' })
  async exportCsv(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const csv = await this.reportsService.generateExpenseCsv(userId, startDate, endDate);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
      res.send(csv);
    }, 'Error occurred while exporting CSV');
  }

  @Get('summary')
  @ApiQuery({ name: 'startDate', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-12-31' })
  async getSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const summary = await this.reportsService.generateSummaryReport(userId, startDate, endDate);
      this.responseService.sendResponse(res, HttpStatus.OK, summary, 'Summary report generated');
    }, 'Error occurred while generating summary report');
  }
}
