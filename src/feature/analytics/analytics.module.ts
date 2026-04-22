import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ResponseService } from '../../common/services/response.service';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { Income, IncomeSchema } from '../incomes/schemas/income.schema';
import { AnalyticsService } from './application/services/analytics.service';
import { AnalyticsController } from './controller/analytics.controller';

@Module({
  imports: [
    // Analytics service needs to access the Expense/Income models directly for aggregations
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: Income.name, schema: IncomeSchema }
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [ResponseService, AnalyticsService],
})
export class AnalyticsModule {}
