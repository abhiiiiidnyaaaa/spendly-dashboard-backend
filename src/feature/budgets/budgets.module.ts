import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ResponseService } from '../../common/services/response.service';
import { Budget, BudgetSchema } from './schemas/budget.schema';
import { BudgetRepository } from './repositories/budget.repository';
import { BudgetValidationHelper } from './helpers/budget-validation.helper';
import { CreateBudgetUseCase } from './application/use-cases/create-budget.usecase';
import { UpdateBudgetUseCase } from './application/use-cases/update-budget.usecase';
import { DeleteBudgetUseCase } from './application/use-cases/delete-budget.usecase';
import { BudgetService } from './application/services/budget.service';
import { BudgetController } from './controller/budget.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Budget.name, schema: BudgetSchema }]),
  ],
  controllers: [BudgetController],
  providers: [
    ResponseService,
    BudgetRepository,
    BudgetValidationHelper,
    CreateBudgetUseCase,
    UpdateBudgetUseCase,
    DeleteBudgetUseCase,
    BudgetService,
  ],
  exports: [BudgetService],
})
export class BudgetsModule {}
