import { Injectable, Logger, BadRequestException, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const Razorpay = require('razorpay');
import * as crypto from 'crypto';
import { Request } from 'express';
import { UserService } from '../../../users/application/services/user.service';
import { UserRepository } from '../../../users/repositories/user.repository';

@Injectable()
export class RazorpayService {
  private readonly razorpay: any;
  private readonly logger = new Logger(RazorpayService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    
    if (!keyId || !keySecret) {
      this.logger.warn('RAZORPAY credentials are not defined. Billing features will fail.');
    }
    
    this.razorpay = new Razorpay({
      key_id: keyId || 'mock_key_id',
      key_secret: keySecret || 'mock_key_secret',
    });
  }

  /**
   * Create a customer in Razorpay. Usually called upon user registration.
   */
  async createCustomer(name: string, email: string): Promise<string> {
    try {
      const customer = await this.razorpay.customers.create({
        name,
        email,
      });
      return customer.id;
    } catch (error: any) {
      this.logger.error(`Failed to create Razorpay customer: ${error.message || JSON.stringify(error)}`);
      throw new BadRequestException('Payment gateway error');
    }
  }

  /**
   * Generates a Subscription link for a user to subscribe to the Pro plan.
   */
  async createSubscription(userId: string): Promise<{ id: string, short_url: string }> {
    const user = await this.userService.findById(userId);

    if (!user.razorpayCustomerId) {
      this.logger.log(`User ${user._id} does not have a Razorpay customer ID. Creating one now...`);
      try {
        const customerId = await this.createCustomer(user.name, user.email);
        await this.userRepository.update(user._id.toString(), { razorpayCustomerId: customerId } as any);
        user.razorpayCustomerId = customerId;
      } catch (error) {
        throw new BadRequestException('Failed to register user as a payment customer. Please try again later.');
      }
    }

    if (user.planTier === 'PRO' && user.razorpaySubscriptionStatus === 'active') {
      throw new BadRequestException('User is already subscribed to the PRO plan');
    }

    const planId = this.configService.get<string>('RAZORPAY_PRO_PLAN_ID');

    try {
      const subscription = await this.razorpay.subscriptions.create({
        plan_id: planId,
        customer_id: user.razorpayCustomerId,
        total_count: 120, // Example: 10 years
        customer_notify: 1,
        notes: {
          userId: user._id.toString(),
        },
      });

      return { 
        id: subscription.id,
        short_url: subscription.short_url 
      };
    } catch (error: any) {
      this.logger.error(`Failed to create subscription: ${error.message || JSON.stringify(error)}`);
      throw new BadRequestException('Could not initiate checkout');
    }
  }

  /**
   * Cancel an active subscription.
   */
  async cancelSubscription(userId: string): Promise<{ success: boolean }> {
    const user = await this.userService.findById(userId);

    if (!user.razorpaySubscriptionId) {
      throw new BadRequestException('User does not have an active subscription');
    }

    try {
      await this.razorpay.subscriptions.cancel(user.razorpaySubscriptionId);
      
      await this.userRepository.update(user._id.toString(), {
        planTier: 'FREE',
        razorpaySubscriptionStatus: 'cancelled',
      } as any);

      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to cancel subscription: ${error.message || JSON.stringify(error)}`);
      throw new BadRequestException('Could not cancel subscription');
    }
  }

  /**
   * Handles incoming webhooks from Razorpay
   */
  async handleWebhook(req: RawBodyRequest<Request>, signature: string) {
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || 'mock_secret';
    
    // Validate signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.rawBody!.toString())
      .digest('hex');

    if (expectedSignature !== signature) {
      this.logger.error('Invalid Razorpay webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const event = req.body;

    switch (event.event) {
      case 'subscription.charged':
      case 'subscription.activated': {
        const subscription = event.payload.subscription.entity;
        const customerId = subscription.customer_id;
        
        const user = await this.userRepository.findByRazorpayCustomerId(customerId);
        
        if (user) {
          const isActive = subscription.status === 'active' || subscription.status === 'authenticated';
          await this.userRepository.update(user._id.toString(), {
            planTier: isActive ? 'PRO' : 'FREE',
            razorpaySubscriptionId: subscription.id,
            razorpaySubscriptionStatus: subscription.status,
          } as any);
          
          this.logger.log(`Updated subscription status for user ${user._id} to ${subscription.status}`);
        }
        break;
      }

      case 'subscription.halted':
      case 'subscription.cancelled': {
        const subscription = event.payload.subscription.entity;
        const customerId = subscription.customer_id;
        
        const user = await this.userRepository.findByRazorpayCustomerId(customerId);
        
        if (user) {
          await this.userRepository.update(user._id.toString(), {
            planTier: 'FREE',
            razorpaySubscriptionStatus: subscription.status,
          } as any);
          
          this.logger.log(`Subscription ${subscription.status} for user ${user._id}`);
        }
        break;
      }
      
      default:
        this.logger.debug(`Unhandled Razorpay event type ${event.event}`);
    }

    return { status: 'ok' };
  }
}
