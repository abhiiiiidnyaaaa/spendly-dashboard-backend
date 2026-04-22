import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BudgetRepository } from '../repositories/budget.repository';
import { BudgetDocument } from '../schemas/budget.schema';

@Injectable()
export class BudgetValidationHelper {
  constructor(private readonly repository: BudgetRepository) {}

  async validateBudgetExists(budgetId: string, userId: string): Promise<BudgetDocument> {
    const budget = await this.repository.findById(budgetId, userId);
    if (!budget) {
      throw new NotFoundException('Budget not found or unauthorized');
    }
    return budget;
  }

  async validateUniqueBudget(
    userId: string,
    category: string,
    month: number,
    year: number,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.repository.findByCategoryAndMonth(userId, category, month, year);
    if (existing && (!excludeId || existing._id.toString() !== excludeId)) {
      throw new ConflictException(`A budget for '${category}' in ${month}/${year} already exists`);
    }
  }
}
