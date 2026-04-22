import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BudgetService } from '../application/services/budget.service';
import { CreateBudgetDto } from '../dto/create-budget.dto';
import { UpdateBudgetDto } from '../dto/update-budget.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetController extends BaseController {
  constructor(
    private readonly budgetService: BudgetService,
    private readonly responseService: ResponseService,
  ) {
    super();
  }

  @Post()
  async create(
    @Body() dto: CreateBudgetDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const budget = await this.budgetService.create(userId, dto);
      this.responseService.sendResponse(res, HttpStatus.CREATED, budget, 'Budget created successfully');
    }, 'Error occurred while creating budget');
  }

  @Get()
  @ApiQuery({ name: 'month', example: 4, type: Number })
  @ApiQuery({ name: 'year', example: 2026, type: Number })
  async findByMonth(
    @Query('month') month: number,
    @Query('year') year: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const budgets = await this.budgetService.findByMonthWithSpent(userId, month, year);
      this.responseService.sendResponse(res, HttpStatus.OK, budgets, 'Budgets retrieved successfully');
    }, 'Error occurred while fetching budgets');
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const budget = await this.budgetService.update(id, userId, dto);
      this.responseService.sendResponse(res, HttpStatus.OK, budget, 'Budget updated successfully');
    }, 'Error occurred while updating budget');
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      await this.budgetService.delete(id, userId);
      this.responseService.sendResponse(res, HttpStatus.OK, null, 'Budget deleted successfully');
    }, 'Error occurred while deleting budget');
  }
}
