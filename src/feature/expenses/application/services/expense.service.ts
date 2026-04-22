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

@Injectable()
export class ExpenseService {
  constructor(
    private readonly createUseCase: CreateExpenseUseCase,
    private readonly findAllUseCase: FindAllExpensesUseCase,
    private readonly findUseCase: FindExpenseUseCase,
    private readonly updateUseCase: UpdateExpenseUseCase,
    private readonly deleteUseCase: DeleteExpenseUseCase,
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
}
