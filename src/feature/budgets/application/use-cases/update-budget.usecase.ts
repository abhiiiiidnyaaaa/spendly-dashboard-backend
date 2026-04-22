import { Injectable } from '@nestjs/common';
import { UpdateBudgetDto } from '../../dto/update-budget.dto';
import { BudgetDocument } from '../../schemas/budget.schema';
import { BudgetRepository } from '../../repositories/budget.repository';
import { BudgetValidationHelper } from '../../helpers/budget-validation.helper';

@Injectable()
export class UpdateBudgetUseCase {
  constructor(
    private readonly repository: BudgetRepository,
    private readonly validationHelper: BudgetValidationHelper,
  ) {}

  async execute(budgetId: string, userId: string, dto: UpdateBudgetDto): Promise<BudgetDocument> {
    const existing = await this.validationHelper.validateBudgetExists(budgetId, userId);

    if (dto.category && dto.category !== existing.category) {
      await this.validationHelper.validateUniqueBudget(
        userId,
        dto.category.trim(),
        dto.month ?? existing.month,
        dto.year ?? existing.year,
        budgetId,
      );
    }

    const updated = await this.repository.update(budgetId, userId, dto);
    return updated!;
  }
}
