import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AiChatService } from './application/services/ai-chat.service';
import { AiChatController } from './controller/ai-chat.controller';
import { ResponseService } from '../../common/services/response.service';
import { Expense, ExpenseSchema } from '../expenses/schemas/expense.schema';
import { Income, IncomeSchema } from '../incomes/schemas/income.schema';
import { Goal, GoalSchema } from '../goals/schemas/goal.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ExpensesModule } from '../expenses/expenses.module';
import { IncomesModule } from '../incomes/incomes.module';
import { AiChatSession, AiChatSessionSchema } from './schemas/ai-chat-session.schema';

@Module({
  imports: [
    ConfigModule,
    ExpensesModule,
    IncomesModule,
    MongooseModule.forFeature([
      { name: Expense.name, schema: ExpenseSchema },
      { name: Income.name, schema: IncomeSchema },
      { name: Goal.name, schema: GoalSchema },
      { name: User.name, schema: UserSchema },
      { name: AiChatSession.name, schema: AiChatSessionSchema },
    ]),
  ],
  controllers: [AiChatController],
  providers: [AiChatService, ResponseService],
  exports: [AiChatService],
})
export class AiChatModule {}
