import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from '../../common/services/response.service';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { NotificationService } from './application/services/notification.service';
import { NotificationController } from './controller/notification.controller';

@Global() // Available everywhere — just like MailModule
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
  ],
  controllers: [NotificationController],
  providers: [
    ResponseService,
    NotificationRepository,
    NotificationsGateway,
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
