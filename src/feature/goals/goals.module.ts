import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from '../../common/services/response.service';
import { Goal, GoalSchema } from './schemas/goal.schema';
import { GoalRepository } from './repositories/goal.repository';
import { GoalService } from './application/services/goal.service';
import { GoalController } from './controller/goal.controller';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Goal.name, schema: GoalSchema }]),
    MailModule,
    UsersModule,
    GamificationModule,
  ],
  controllers: [GoalController],
  providers: [
    ResponseService,
    GoalRepository,
    GoalService,
  ],
  exports: [GoalService],
})
export class GoalsModule {}
