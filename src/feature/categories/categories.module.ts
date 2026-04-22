import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ResponseService } from '../../common/services/response.service';
import { Category, CategorySchema } from './schemas/category.schema';
import { CategoryRepository } from './repositories/category.repository';
import { CategoryValidationHelper } from './helpers/category-validation.helper';
import { CreateCategoryUseCase } from './application/use-cases/create-category.usecase';
import { FindAllCategoriesUseCase } from './application/use-cases/find-all-categories.usecase';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.usecase';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.usecase';
import { CategoryService } from './application/services/category.service';
import { CategoryController } from './controller/category.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
  ],
  controllers: [CategoryController],
  providers: [
    ResponseService,
    CategoryRepository,
    CategoryValidationHelper,
    CreateCategoryUseCase,
    FindAllCategoriesUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    CategoryService,
  ],
  exports: [CategoryService],
})
export class CategoriesModule {}
