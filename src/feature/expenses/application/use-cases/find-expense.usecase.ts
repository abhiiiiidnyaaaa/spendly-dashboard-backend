import { Injectable } from '@nestjs/common';
import { ExpenseDocument } from '../../schemas/expense.schema';
import { ExpenseValidationHelper } from '../../helpers/expense-validation.helper';

@Injectable()
export class FindExpenseUseCase {
  constructor(private readonly validationHelper: ExpenseValidationHelper) {}

  async execute(expenseId: string, userId: string): Promise<ExpenseDocument> {
    return this.validationHelper.validateExpenseExists(expenseId, userId);
  }
}
