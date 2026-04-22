import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseRepository } from '../repositories/expense.repository';
import { ExpenseDocument } from '../schemas/expense.schema';

@Injectable()
export class ExpenseValidationHelper {
  constructor(private readonly repository: ExpenseRepository) {}

  /**
   * Validates that an expense exists and belongs to the given user.
   */
  async validateExpenseExists(
    expenseId: string,
    userId: string,
  ): Promise<ExpenseDocument> {
    const expense = await this.repository.findById(expenseId, userId);
    if (!expense) {
      throw new NotFoundException('Expense not found or unauthorized');
    }
    return expense;
  }
}
