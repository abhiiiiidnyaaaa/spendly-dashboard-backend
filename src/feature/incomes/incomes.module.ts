import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Income, IncomeSchema } from './schemas/income.schema';
import { IncomeRepository } from './repositories/income.repository';
import { IncomeService } from './application/services/income.service';
import { IncomeController } from './controller/income.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Income.name, schema: IncomeSchema }]),
  ],
  controllers: [IncomeController],
  providers: [IncomeRepository, IncomeService],
  exports: [IncomeService],
})
export class IncomesModule {}
