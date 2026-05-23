import { Controller, Post, Get, Headers, Req, Res, HttpStatus, UseGuards, RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseController } from '../../../common/base/base.controller';
import { ResponseService } from '../../../common/services/response.service';
import { RazorpayService } from '../application/services/razorpay.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Billing')
@Controller('api/v1/billing')
export class BillingController extends BaseController {
  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly responseService: ResponseService,
  ) {
    super();
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Razorpay Subscription' })
  async createSubscription(@Req() req: any, @Res() res: Response) {
    await this.handleRequest(async () => {
      const result = await this.razorpayService.createSubscription(req.user.id);
      this.responseService.sendResponse(res, HttpStatus.OK, result, 'Subscription created');
    }, 'Error creating subscription');
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an active Razorpay subscription' })
  async cancelSubscription(@Req() req: any, @Res() res: Response) {
    await this.handleRequest(async () => {
      const result = await this.razorpayService.cancelSubscription(req.user.id);
      this.responseService.sendResponse(res, HttpStatus.OK, result, 'Subscription cancelled');
    }, 'Error cancelling subscription');
  }

  @ApiOperation({ summary: 'Razorpay webhook receiver (do not call directly)' })
  async handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    await this.handleRequest(async () => {
      const result = await this.razorpayService.handleWebhook(req, signature);
      this.responseService.sendResponse(res, HttpStatus.OK, result, 'Webhook handled');
    }, 'Error handling webhook');
  }
}
