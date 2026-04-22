import { Injectable } from '@nestjs/common';
import { CreateBudgetDto } from '../../dto/create-budget.dto';
import { BudgetDocument } from '../../schemas/budget.schema';
import { BudgetRepository } from '../../repositories/budget.repository';
import { BudgetValidationHelper } from '../../helpers/budget-validation.helper';

@Injectable()
export class CreateBudgetUseCase {
  constructor(
    private readonly repository: BudgetRepository,
    private readonly validationHelper: BudgetValidationHelper,
  ) {}

  async execute(userId: string, dto: CreateBudgetDto): Promise<BudgetDocument> {
    await this.validationHelper.validateUniqueBudget(userId, dto.category.trim(), dto.month, dto.year);

    return this.repository.create({
      userId,
      category: dto.category.trim(),
      limitAmount: dto.limitAmount,
      month: dto.month,
      year: dto.year,
      alertThreshold: dto.alertThreshold ?? 90,
    });
  }
}
