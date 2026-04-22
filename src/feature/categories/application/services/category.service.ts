import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from '../../dto/create-category.dto';
import { UpdateCategoryDto } from '../../dto/update-category.dto';
import { CategoryDocument } from '../../schemas/category.schema';

import { CreateCategoryUseCase } from '../use-cases/create-category.usecase';
import { FindAllCategoriesUseCase } from '../use-cases/find-all-categories.usecase';
import { UpdateCategoryUseCase } from '../use-cases/update-category.usecase';
import { DeleteCategoryUseCase } from '../use-cases/delete-category.usecase';
import { CategoryRepository } from '../../repositories/category.repository';

@Injectable()
export class CategoryService {
  constructor(
    private readonly createUseCase: CreateCategoryUseCase,
    private readonly findAllUseCase: FindAllCategoriesUseCase,
    private readonly updateUseCase: UpdateCategoryUseCase,
    private readonly deleteUseCase: DeleteCategoryUseCase,
    private readonly repository: CategoryRepository
  ) {}

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryDocument> {
    return this.createUseCase.execute(userId, dto);
  }

  async findAll(userId: string): Promise<CategoryDocument[]> {
    return this.findAllUseCase.execute(userId);
  }

  async update(
    categoryId: string,
    userId: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    return this.updateUseCase.execute(categoryId, userId, dto);
  }

  async delete(categoryId: string, userId: string): Promise<boolean> {
    return this.deleteUseCase.execute(categoryId, userId);
  }

  /**
   * Helper method to initialize default categories for a new user
   */
  async seedDefaultCategories(userId: string): Promise<void> {
    const defaults = [
      { userId, name: 'Food & Dining', color: '#EF4444', icon: 'restaurant' },
      { userId, name: 'Transportation', color: '#3B82F6', icon: 'directions_car' },
      { userId, name: 'Housing', color: '#10B981', icon: 'home' },
      { userId, name: 'Utilities', color: '#F59E0B', icon: 'bolt' },
      { userId, name: 'Entertainment', color: '#8B5CF6', icon: 'movie' },
      { userId, name: 'Healthcare', color: '#EC4899', icon: 'local_hospital' },
    ];
    await this.repository.createMany(defaults);
  }
}
