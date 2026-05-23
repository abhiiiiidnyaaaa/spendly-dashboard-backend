import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionRepository } from '../../repositories/subscription.repository';
import { ExpenseService } from '../../../expenses/application/services/expense.service';
import { MailService } from '../../../mail/application/services/mail.service';
import { UserService } from '../../../users/application/services/user.service';
import { NotificationService } from '../../../notifications/application/services/notification.service';

@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly expenseService: ExpenseService,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  // Run every night at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDueSubscriptions() {
    this.logger.log('Starting daily check for due subscriptions...');
    
    const today = new Date();
    // Find subscriptions where nextBillingDate is today or passed
    const dueSubscriptions = await this.subscriptionRepository.findDueSubscriptions(today);
    
    this.logger.log(`Found ${dueSubscriptions.length} subscriptions due for billing processing.`);

    for (const sub of dueSubscriptions) {
      try {
        // 1. Create the new expense entry
        await this.expenseService.create(sub.userId, {
          amount: sub.amount,
          category: sub.category,
          date: new Date().toISOString(),
          description: `Auto-billed: ${sub.name}`,
          currency: sub.currency,
        });

        // 2. Calculate next billing date
        const nextDate = this.calculateNextBillingDate(sub.nextBillingDate, sub.frequency);

        // 3. Update the subscription in DB
        await this.subscriptionRepository.updateNextBillingDate(sub._id.toString(), nextDate);

        // 4. Real-time in-app notification
        this.notificationService.notifySubscriptionRenewal(sub.userId, sub.name, sub.amount, sub.currency);

        // 5. Send Email Notification
        try {
          const user = await this.userService.findById(sub.userId);
          if (user) {
            this.mailService.sendSubscriptionReminderEmail({
              to: user.email,
              name: user.name,
              subscriptionName: sub.name,
              category: sub.category,
              amount: sub.amount,
              currency: sub.currency,
              billingCycle: sub.frequency,
              renewalDate: nextDate.toLocaleDateString(),
              daysUntilRenewal: 0,
            });
          }
        } catch (mailError) {
          this.logger.error(`Failed to send subscription email for user [${sub.userId}]`, mailError);
        }

        this.logger.log(`Successfully processed subscription [${sub.name}] for User [${sub.userId}]`);
      } catch (error) {
        this.logger.error(`Failed to process subscription [${sub.name}] for User [${sub.userId}]`, error);
      }
    }
    
    this.logger.log('Finished processing due subscriptions.');
  }

  private calculateNextBillingDate(currentDate: Date, frequency: string): Date {
    const date = new Date(currentDate);
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // default to monthly
    }
    return date;
  }
}
