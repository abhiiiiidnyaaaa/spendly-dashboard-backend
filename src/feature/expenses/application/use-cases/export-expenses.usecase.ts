import { Injectable, Logger } from '@nestjs/common';
import { ExpenseRepository } from '../../repositories/expense.repository';
import { parse } from 'json2csv';

@Injectable()
export class ExportExpensesUseCase {
  private readonly logger = new Logger(ExportExpensesUseCase.name);

  constructor(private readonly repository: ExpenseRepository) {}

  async execute(userId: string): Promise<string> {
    // Fetch all expenses without pagination limits
    const result = await this.repository.findAll(userId, { limit: 10000 }); // Large limit for export
    const expenses = result.data;

    if (expenses.length === 0) {
      return '';
    }

    // Map to a clean structure for CSV
    const csvData = expenses.map((exp) => ({
      Date: new Date(exp.date).toISOString().split('T')[0],
      Category: exp.category,
      Amount: exp.amount,
      Currency: exp.currency,
      Description: exp.description,
      ReceiptText: exp.receiptText ? exp.receiptText.replace(/\\n/g, ' ') : '', // Flatten newlines
    }));

    try {
      const csv = parse(csvData);
      return csv;
    } catch (err) {
      this.logger.error('Failed to parse CSV', err);
      throw err;
    }
  }
}
