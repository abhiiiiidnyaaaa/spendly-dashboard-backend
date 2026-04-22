import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';
import { CategoryDocument } from '../schemas/category.schema';

@Injectable()
export class CategoryValidationHelper {
  constructor(private readonly repository: CategoryRepository) {}

  async validateCategoryExists(
    categoryId: string,
    userId: string,
  ): Promise<CategoryDocument> {
    const category = await this.repository.findById(categoryId, userId);
    if (!category) {
      throw new NotFoundException('Category not found or unauthorized');
    }
    return category;
  }

  async validateNameUniqueness(
    name: string,
    userId: string,
    excludeId?: string,
  ): Promise<void> {
    const exists = await this.repository.existsByName(name, userId, excludeId);
    if (exists) {
      throw new ConflictException(`Category with the name '${name}' already exists.`);
    }
  }
}
