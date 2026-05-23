import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ResponseService } from '../../common/services/response.service';
import { Expense, ExpenseSchema } from './schemas/expense.schema';
import { ExpenseRepository } from './repositories/expense.repository';
import { ExpenseValidationHelper } from './helpers/expense-validation.helper';
import { CreateExpenseUseCase } from './application/use-cases/create-expense.usecase';
import { FindAllExpensesUseCase } from './application/use-cases/find-all-expenses.usecase';
import { FindExpenseUseCase } from './application/use-cases/find-expense.usecase';
import { UpdateExpenseUseCase } from './application/use-cases/update-expense.usecase';
import { DeleteExpenseUseCase } from './application/use-cases/delete-expense.usecase';
import { UploadReceiptUseCase } from './application/use-cases/upload-receipt.usecase';
import { ExportExpensesUseCase } from './application/use-cases/export-expenses.usecase';
import { ImportExpensesUseCase } from './application/use-cases/import-expenses.usecase';
import { AnalyzeReceiptUseCase } from './application/use-cases/analyze-receipt.usecase';
import { ExpenseService } from './application/services/expense.service';
import { ExpenseController } from './controller/expense.controller';

import { UsersModule } from '../users/users.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }]),
    UsersModule,
    BudgetsModule,
    GamificationModule,
  ],
  controllers: [ExpenseController],
  providers: [
    ResponseService,
    ExpenseRepository,
    ExpenseValidationHelper,
    CreateExpenseUseCase,
    FindAllExpensesUseCase,
    FindExpenseUseCase,
    UpdateExpenseUseCase,
    DeleteExpenseUseCase,
    UploadReceiptUseCase,
    ExportExpensesUseCase,
    ImportExpensesUseCase,
    AnalyzeReceiptUseCase,
    ExpenseService,
  ],
  exports: [ExpenseService], // Might be useful if we want aggregate reports later
})
export class ExpensesModule {}
