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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ExpenseService } from '../application/services/expense.service';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { QueryExpenseDto } from '../dto/query-expense.dto';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/expenses')
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

  @Get('export')
  async exportCsv(@Req() req: Request, @Res() res: Response) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const csvData = await this.expenseService.exportCsv(userId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
      res.status(HttpStatus.OK).send(csvData);
    }, 'Error exporting expenses');
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const result = await this.expenseService.importCsv(userId, file);
      this.responseService.sendResponse(res, HttpStatus.OK, result, 'Expenses imported successfully');
    }, 'Error importing expenses');
  }

  @Post('receipt/analyze')
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => cb(null, `analyze-${Date.now()}${extname(file.originalname)}`),
      }),
    }),
  )
  async analyzeReceipt(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const result = await this.expenseService.analyzeReceipt(file);
      this.responseService.sendResponse(res, HttpStatus.OK, result, 'Receipt analyzed');
    }, 'Error analyzing receipt');
  }

  @Post(':id/receipt')
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-receipt${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadReceipt(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const userId = (req as any).user.id;
      const expense = await this.expenseService.uploadReceipt(id, userId, file);
      this.responseService.sendResponse(res, HttpStatus.OK, expense, 'Receipt uploaded successfully and OCR complete');
    }, 'Error uploading receipt');
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
