import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationService } from './application/services/gamification/gamification.service';
import { GamificationController } from './controller/gamification/gamification.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    NotificationsModule,
  ],
  providers: [GamificationService],
  controllers: [GamificationController],
  exports: [GamificationService],
})
export class GamificationModule {}
