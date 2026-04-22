import { Injectable } from '@nestjs/common';
import { ExpenseRepository } from '../../repositories/expense.repository';
import { ExpenseValidationHelper } from '../../helpers/expense-validation.helper';

@Injectable()
export class DeleteExpenseUseCase {
  constructor(
    private readonly repository: ExpenseRepository,
    private readonly validationHelper: ExpenseValidationHelper,
  ) {}

  async execute(expenseId: string, userId: string): Promise<boolean> {
    await this.validationHelper.validateExpenseExists(expenseId, userId);
    return this.repository.delete(expenseId, userId);
  }
}
