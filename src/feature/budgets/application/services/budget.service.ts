import { Injectable } from '@nestjs/common';
import { CreateBudgetDto } from '../../dto/create-budget.dto';
import { UpdateBudgetDto } from '../../dto/update-budget.dto';
import { BudgetDocument } from '../../schemas/budget.schema';
import { BudgetRepository } from '../../repositories/budget.repository';
import { CreateBudgetUseCase } from '../use-cases/create-budget.usecase';
import { UpdateBudgetUseCase } from '../use-cases/update-budget.usecase';
import { DeleteBudgetUseCase } from '../use-cases/delete-budget.usecase';

@Injectable()
export class BudgetService {
  constructor(
    private readonly createUseCase: CreateBudgetUseCase,
    private readonly updateUseCase: UpdateBudgetUseCase,
    private readonly deleteUseCase: DeleteBudgetUseCase,
    private readonly repository: BudgetRepository,
  ) {}

  async create(userId: string, dto: CreateBudgetDto): Promise<BudgetDocument> {
    return this.createUseCase.execute(userId, dto);
  }

  /**
   * Returns budgets for a specific month WITH real-time spent amounts and status
   */
  async findByMonthWithSpent(userId: string, month: number, year: number) {
    return this.repository.getBudgetsWithSpent(userId, month, year);
  }

  async update(budgetId: string, userId: string, dto: UpdateBudgetDto): Promise<BudgetDocument> {
    return this.updateUseCase.execute(budgetId, userId, dto);
  }

  async delete(budgetId: string, userId: string): Promise<boolean> {
    return this.deleteUseCase.execute(budgetId, userId);
  }
}
