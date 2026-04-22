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

import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ExpenseService } from '../application/services/expense.service';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { QueryExpenseDto } from '../dto/query-expense.dto';

import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpenseController extends BaseController {
  constructor(
    private readonly expenseService: ExpenseService,
    private readonly responseService: ResponseService,
  ) {
    super();
  }

  @Post()
  async create(
    @Body() dto: CreateExpenseDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const expense = await this.expenseService.create(userId, dto);
      this.responseService.sendResponse(
        res,
        HttpStatus.CREATED,
        expense,
        'Expense created successfully',
      );
    }, 'Error occurred while creating expense');
  }

  @Get()
  async findAll(
    @Query() query: QueryExpenseDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const result = await this.expenseService.findAll(userId, query);
      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        result,
        'Expenses retrieved successfully',
      );
    }, 'Error occurred while fetching expenses');
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const expense = await this.expenseService.findById(id, userId);
      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        expense,
        'Expense retrieved successfully',
      );
    }, 'Error occurred while fetching expense');
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const expense = await this.expenseService.update(id, userId, dto);
      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        expense,
        'Expense updated successfully',
      );
    }, 'Error occurred while updating expense');
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      await this.expenseService.delete(id, userId);
      this.responseService.sendResponse(
        res,
        HttpStatus.OK,
        null,
        'Expense deleted successfully',
      );
    }, 'Error occurred while deleting expense');
  }
}
