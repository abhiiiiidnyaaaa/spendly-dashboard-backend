import { Injectable } from '@nestjs/common';
import { QueryExpenseDto } from '../../dto/query-expense.dto';
import { ExpenseRepository } from '../../repositories/expense.repository';

@Injectable()
export class FindAllExpensesUseCase {
  constructor(private readonly repository: ExpenseRepository) {}

  async execute(userId: string, queryDto: QueryExpenseDto) {
    return this.repository.findAll(userId, queryDto);
  }
}
