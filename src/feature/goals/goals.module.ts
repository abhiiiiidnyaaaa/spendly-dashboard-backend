import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from '../../common/services/response.service';
import { Goal, GoalSchema } from './schemas/goal.schema';
import { GoalRepository } from './repositories/goal.repository';
import { GoalService } from './application/services/goal.service';
import { GoalController } from './controller/goal.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Goal.name, schema: GoalSchema }]),
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
