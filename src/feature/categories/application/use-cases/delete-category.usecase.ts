import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '../../repositories/category.repository';
import { CategoryValidationHelper } from '../../helpers/category-validation.helper';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    private readonly repository: CategoryRepository,
    private readonly validationHelper: CategoryValidationHelper,
  ) {}

  async execute(categoryId: string, userId: string): Promise<boolean> {
    await this.validationHelper.validateCategoryExists(categoryId, userId);
    return this.repository.delete(categoryId, userId);
  }
}
