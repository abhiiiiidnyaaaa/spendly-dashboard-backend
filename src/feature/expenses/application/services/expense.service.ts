import { Injectable } from '@nestjs/common';
import { CreateExpenseDto } from '../../dto/create-expense.dto';
import { UpdateExpenseDto } from '../../dto/update-expense.dto';
import { QueryExpenseDto } from '../../dto/query-expense.dto';
import { ExpenseDocument } from '../../schemas/expense.schema';

import { CreateExpenseUseCase } from '../use-cases/create-expense.usecase';
import { FindAllExpensesUseCase } from '../use-cases/find-all-expenses.usecase';
import { FindExpenseUseCase } from '../use-cases/find-expense.usecase';
import { UpdateExpenseUseCase } from '../use-cases/update-expense.usecase';
import { DeleteExpenseUseCase } from '../use-cases/delete-expense.usecase';
import { UploadReceiptUseCase } from '../use-cases/upload-receipt.usecase';
import { ExportExpensesUseCase } from '../use-cases/export-expenses.usecase';
import { ImportExpensesUseCase } from '../use-cases/import-expenses.usecase';
import { AnalyzeReceiptUseCase } from '../use-cases/analyze-receipt.usecase';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly createUseCase: CreateExpenseUseCase,
    private readonly findAllUseCase: FindAllExpensesUseCase,
    private readonly findUseCase: FindExpenseUseCase,
    private readonly updateUseCase: UpdateExpenseUseCase,
    private readonly deleteUseCase: DeleteExpenseUseCase,
    private readonly uploadReceiptUseCase: UploadReceiptUseCase,
    private readonly exportUseCase: ExportExpensesUseCase,
    private readonly importUseCase: ImportExpensesUseCase,
    private readonly analyzeReceiptUseCase: AnalyzeReceiptUseCase,
  ) {}

  async create(userId: string, dto: CreateExpenseDto): Promise<ExpenseDocument> {
    return this.createUseCase.execute(userId, dto);
  }

  async findAll(userId: string, queryDto: QueryExpenseDto) {
    return this.findAllUseCase.execute(userId, queryDto);
  }

  async findById(expenseId: string, userId: string): Promise<ExpenseDocument> {
    return this.findUseCase.execute(expenseId, userId);
  }

  async update(
    expenseId: string,
    userId: string,
    dto: UpdateExpenseDto,
  ): Promise<ExpenseDocument> {
    return this.updateUseCase.execute(expenseId, userId, dto);
  }

  async delete(expenseId: string, userId: string): Promise<boolean> {
    return this.deleteUseCase.execute(expenseId, userId);
  }

  async uploadReceipt(expenseId: string, userId: string, file: Express.Multer.File): Promise<ExpenseDocument> {
    return this.uploadReceiptUseCase.execute(expenseId, userId, file);
  }

  async exportCsv(userId: string): Promise<string> {
    return this.exportUseCase.execute(userId);
  }

  async importCsv(userId: string, file: Express.Multer.File): Promise<{ imported: number }> {
    return this.importUseCase.execute(userId, file);
  }

  async analyzeReceipt(file: Express.Multer.File): Promise<{ text: string, amount: number | null, date: string | null, merchant: string | null }> {
    return this.analyzeReceiptUseCase.execute(file);
  }
}
