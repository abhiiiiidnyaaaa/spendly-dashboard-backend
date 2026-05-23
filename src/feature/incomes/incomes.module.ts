import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Income, IncomeSchema } from './schemas/income.schema';
import { IncomeRepository } from './repositories/income.repository';
import { IncomeService } from './application/services/income.service';
import { IncomeController } from './controller/income.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Income.name, schema: IncomeSchema }]),
    UsersModule,
  ],
  controllers: [IncomeController],
  providers: [IncomeRepository, IncomeService],
  exports: [IncomeService],
})
export class IncomesModule {}
