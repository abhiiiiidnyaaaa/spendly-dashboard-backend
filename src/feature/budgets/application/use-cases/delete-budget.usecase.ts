import { Injectable } from '@nestjs/common';
import { BudgetRepository } from '../../repositories/budget.repository';
import { BudgetValidationHelper } from '../../helpers/budget-validation.helper';

@Injectable()
export class DeleteBudgetUseCase {
  constructor(
    private readonly repository: BudgetRepository,
    private readonly validationHelper: BudgetValidationHelper,
  ) {}

  async execute(budgetId: string, userId: string): Promise<boolean> {
    await this.validationHelper.validateBudgetExists(budgetId, userId);
    return this.repository.delete(budgetId, userId);
  }
}
