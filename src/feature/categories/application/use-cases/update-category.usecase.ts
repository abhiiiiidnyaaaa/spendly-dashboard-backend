import { Injectable } from '@nestjs/common';
import { UpdateCategoryDto } from '../../dto/update-category.dto';
import { CategoryDocument } from '../../schemas/category.schema';
import { CategoryRepository } from '../../repositories/category.repository';
import { CategoryValidationHelper } from '../../helpers/category-validation.helper';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    private readonly repository: CategoryRepository,
    private readonly validationHelper: CategoryValidationHelper,
  ) {}

  async execute(
    categoryId: string,
    userId: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    await this.validationHelper.validateCategoryExists(categoryId, userId);

    const updateData: any = { ...dto };
    if (dto.name) {
      updateData.name = dto.name.trim();
      await this.validationHelper.validateNameUniqueness(
        updateData.name,
        userId,
        categoryId,
      );
    }

    const updated = await this.repository.update(categoryId, userId, updateData);
    return updated!;
  }
}
