import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from '../../common/services/response.service';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { Income, IncomeSchema } from '../incomes/schemas/income.schema';
import { Goal, GoalSchema } from '../goals/schemas/goal.schema';
import { InsightsService } from './application/services/insights.service';
import { InsightsController } from './controller/insights.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: Income.name, schema: IncomeSchema },
      { name: Goal.name, schema: GoalSchema },
    ]),
  ],
  controllers: [InsightsController],
  providers: [ResponseService, InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
