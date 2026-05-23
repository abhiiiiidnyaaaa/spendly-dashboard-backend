import { Controller, Get, UseGuards, Req, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { InsightsService } from '../application/services/insights.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Insights & Forecasting')
@ApiBearerAuth()
@Controller('api/v1/insights')
@UseGuards(JwtAuthGuard)
export class InsightsController extends BaseController {
  constructor(
    private readonly insightsService: InsightsService,
    private readonly responseService: ResponseService,
  ) {
    super();
  }

  @Get('forecast')
  async getSpendingForecast(@Req() req: any, @Res() res: Response) {
    await this.handleRequest(async () => {
      const data = await this.insightsService.getSpendingForecast(req.user.id);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Spending forecast generated');
    }, 'Failed to generate spending forecast');
  }

  @Get('savings-rate')
  async getSavingsRate(@Req() req: any, @Res() res: Response) {
    await this.handleRequest(async () => {
      const data = await this.insightsService.getSavingsRate(req.user.id);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Savings rate calculated');
    }, 'Failed to calculate savings rate');
  }

  @Get('goal-predictions')
  async getGoalPredictions(@Req() req: any, @Res() res: Response) {
    await this.handleRequest(async () => {
      const data = await this.insightsService.getGoalPredictions(req.user.id);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Goal predictions generated');
    }, 'Failed to generate goal predictions');
  }

  @Get('cashflow')
  async getCashFlow(@Req() req: any, @Res() res: Response) {
    await this.handleRequest(async () => {
      const data = await this.insightsService.getCashFlow(req.user.id);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Cash flow analysis complete');
    }, 'Failed to analyze cash flow');
  }

  @Get('investments')
  async getInvestmentSuggestions(@Req() req: any, @Res() res: Response) {
    await this.handleRequest(async () => {
      const data = await this.insightsService.getInvestmentSuggestions(req.user.id);
      this.responseService.sendResponse(res, HttpStatus.OK, data, 'Investment suggestions generated');
    }, 'Failed to generate investment suggestions');
  }
}
