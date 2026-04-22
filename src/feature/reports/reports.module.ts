import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ResponseService } from '../../common/services/response.service';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { ReportsService } from './application/services/reports.service';
import { ReportsController } from './controller/reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }]),
  ],
  controllers: [ReportsController],
  providers: [ResponseService, ReportsService],
})
export class ReportsModule {}
