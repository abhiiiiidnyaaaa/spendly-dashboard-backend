import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '../../repositories/category.repository';
import { CategoryDocument } from '../../schemas/category.schema';

@Injectable()
export class FindAllCategoriesUseCase {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(userId: string): Promise<CategoryDocument[]> {
    return this.repository.findAll(userId);
  }
}
