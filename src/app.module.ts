import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './feature/users/users.module';
import { AuthModule } from './feature/auth/auth.module';
import { ExpensesModule } from './feature/expenses/expenses.module';
import { CategoriesModule } from './feature/categories/categories.module';
import { AnalyticsModule } from './feature/analytics/analytics.module';
import { BudgetsModule } from './feature/budgets/budgets.module';
import { ReportsModule } from './feature/reports/reports.module';
import { IncomesModule } from './feature/incomes/incomes.module';
import { SubscriptionsModule } from './feature/subscriptions/subscriptions.module';
import { MailModule } from './feature/mail/mail.module';
import { GoalsModule } from './feature/goals/goals.module';

@Module({
  imports: [
    // 1. Setup ConfigModule to read variables from .env
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: '.env',
    }),
    
    // 2. Setup MongooseModule to connect to MongoDB using the URI from .env
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    // 3. Serve Static Files (Multer Uploads)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // 4. CRON Scheduling
    ScheduleModule.forRoot(),

    // 5. Email System (Global — available everywhere)
    MailModule,

    // 6. Feature Modules
    AuthModule,
    UsersModule,
    ExpensesModule,
    CategoriesModule,
    AnalyticsModule,
    BudgetsModule,
    ReportsModule,
    IncomesModule,
    SubscriptionsModule,
    GoalsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
