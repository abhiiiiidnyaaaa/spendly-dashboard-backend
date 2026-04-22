import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { SubscriptionService } from './application/services/subscription.service';
import { SubscriptionCronService } from './application/services/subscription-cron.service';
import { SubscriptionController } from './controller/subscription.controller';
import { ExpensesModule } from '../expenses/expenses.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Subscription.name, schema: SubscriptionSchema }]),
    ExpensesModule, // Needed because our Cron job injects ExpenseService
    UsersModule,    // Needed for email notifications in cron job
  ],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionRepository,
    SubscriptionService,
    SubscriptionCronService,
  ],
  exports: [SubscriptionService],
})
export class SubscriptionsModule {}
