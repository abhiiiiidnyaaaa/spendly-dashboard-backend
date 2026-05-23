import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RazorpayService } from './application/services/razorpay.service';
import { BillingController } from './controller/billing.controller';
import { UsersModule } from '../users/users.module';
import { ResponseService } from '../../common/services/response.service';

@Module({
  imports: [ConfigModule, UsersModule],
  controllers: [BillingController],
  providers: [RazorpayService, ResponseService],
  exports: [RazorpayService],
})
export class BillingModule {}
