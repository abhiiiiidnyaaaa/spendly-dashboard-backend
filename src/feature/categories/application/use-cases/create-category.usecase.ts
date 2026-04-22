import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from '../../dto/create-category.dto';
import { CategoryDocument } from '../../schemas/category.schema';
import { CategoryRepository } from '../../repositories/category.repository';
import { CategoryValidationHelper } from '../../helpers/category-validation.helper';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    private readonly repository: CategoryRepository,
    private readonly validationHelper: CategoryValidationHelper,
  ) {}

  async execute(
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryDocument> {
    const trimmedName = dto.name.trim();

    await this.validationHelper.validateNameUniqueness(trimmedName, userId);

    return this.repository.create({
      userId,
      name: trimmedName,
      color: dto.color,
      icon: dto.icon,
    });
  }
}
