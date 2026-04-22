import { Injectable } from '@nestjs/common';
import { UpdateExpenseDto } from '../../dto/update-expense.dto';
import { ExpenseDocument } from '../../schemas/expense.schema';
import { ExpenseRepository } from '../../repositories/expense.repository';
import { ExpenseValidationHelper } from '../../helpers/expense-validation.helper';

@Injectable()
export class UpdateExpenseUseCase {
  constructor(
    private readonly repository: ExpenseRepository,
    private readonly validationHelper: ExpenseValidationHelper,
  ) {}

  async execute(
    expenseId: string,
    userId: string,
    dto: UpdateExpenseDto,
  ): Promise<ExpenseDocument> {
    await this.validationHelper.validateExpenseExists(expenseId, userId);

    const updateData: any = { ...dto };
    if (dto.date) updateData.date = new Date(dto.date);
    if (dto.category) updateData.category = dto.category.trim();
    if (dto.description) updateData.description = dto.description.trim();

    const updated = await this.repository.update(expenseId, userId, updateData);
    return updated!;
  }
}
