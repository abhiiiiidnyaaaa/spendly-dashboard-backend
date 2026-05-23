/**
 * MailService
 *
 * Core email sending service. Uses @nestjs-modules/mailer with Handlebars templates.
 * Provides methods for each email type used across the application.
 *
 * USAGE:
 *  - Inject MailService into any service that needs to send emails.
 *  - Each method accepts a typed payload and sends the appropriate template.
 *  - Emails are sent asynchronously (fire-and-forget) to avoid blocking main flow.
 */

import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MAIL_SUBJECTS } from '../../constants/mail.constants';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly dashboardUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.dashboardUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  /**
   * Send welcome email after user registration
   */
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject: MAIL_SUBJECTS.WELCOME,
        template: 'welcome',
        context: {
          name,
          dashboardUrl: this.dashboardUrl,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}`, error.stack);
      // Don't throw — email failure should not block registration
    }
  }

  /**
   * Send password reset email with a reset code
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetCode: string,
  ): Promise<void> {
    try {
      const resetUrl = `${this.dashboardUrl}/reset-password?code=${resetCode}`;
      await this.mailerService.sendMail({
        to,
        subject: MAIL_SUBJECTS.PASSWORD_RESET,
        template: 'password-reset',
        context: {
          name,
          resetCode,
          resetUrl,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error.stack);
    }
  }

  /**
   * Send budget alert when spending exceeds threshold
   */
  async sendBudgetAlertEmail(payload: {
    to: string;
    name: string;
    category: string;
    spentAmount: number;
    limitAmount: number;
    percentUsed: number;
    currency: string;
    month: number;
    year: number;
  }): Promise<void> {
    try {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      const monthYear = `${monthNames[payload.month - 1]} ${payload.year}`;
      const remainingAmount = Math.max(0, payload.limitAmount - payload.spentAmount);

      await this.mailerService.sendMail({
        to: payload.to,
        subject: `${MAIL_SUBJECTS.BUDGET_ALERT} (${payload.category})`,
        template: 'budget-alert',
        context: {
          name: payload.name,
          category: payload.category,
          spentAmount: payload.spentAmount.toLocaleString(),
          limitAmount: payload.limitAmount.toLocaleString(),
          remainingAmount: remainingAmount.toLocaleString(),
          percentUsed: Math.round(payload.percentUsed),
          currency: payload.currency,
          monthYear,
          dashboardUrl: this.dashboardUrl,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Budget alert email sent to ${payload.to} for category: ${payload.category}`);
    } catch (error) {
      this.logger.error(`Failed to send budget alert email to ${payload.to}`, error.stack);
    }
  }

  /**
   * Send subscription renewal reminder
   */
  async sendSubscriptionReminderEmail(payload: {
    to: string;
    name: string;
    subscriptionName: string;
    category: string;
    amount: number;
    currency: string;
    billingCycle: string;
    renewalDate: string;
    daysUntilRenewal: number;
  }): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `${MAIL_SUBJECTS.SUBSCRIPTION_REMINDER} — ${payload.subscriptionName}`,
        template: 'subscription-reminder',
        context: {
          name: payload.name,
          subscriptionName: payload.subscriptionName,
          category: payload.category,
          amount: payload.amount.toLocaleString(),
          currency: payload.currency,
          billingCycle: payload.billingCycle,
          renewalDate: payload.renewalDate,
          daysUntilRenewal: payload.daysUntilRenewal,
          dashboardUrl: this.dashboardUrl,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Subscription reminder sent to ${payload.to} for: ${payload.subscriptionName}`);
    } catch (error) {
      this.logger.error(`Failed to send subscription reminder to ${payload.to}`, error.stack);
    }
  }

  /**
   * Send Goal Milestone Alert (50% or 100%)
   */
  async sendGoalMilestoneEmail(payload: {
    to: string;
    name: string;
    goalName: string;
    targetAmount: number;
    currentAmount: number;
    percentAchieved: number;
    currency: string;
  }): Promise<void> {
    try {
      const isComplete = payload.percentAchieved >= 100;
      const milestoneTitle = isComplete ? 'Goal Conquered!' : 'Halfway There!';
      const milestoneMessage = isComplete 
        ? "Incredible job! You've successfully reached your target amount. It's time to celebrate!"
        : "You are officially halfway to your goal. Keep up the fantastic saving habits!";

      await this.mailerService.sendMail({
        to: payload.to,
        subject: `${MAIL_SUBJECTS.GOAL_MILESTONE} — ${payload.goalName}`,
        template: 'goal-milestone',
        context: {
          name: payload.name,
          goalName: payload.goalName,
          targetAmount: payload.targetAmount.toLocaleString(),
          currentAmount: payload.currentAmount.toLocaleString(),
          percentAchieved: Math.round(payload.percentAchieved),
          currency: payload.currency,
          milestoneTitle,
          milestoneMessage,
          dashboardUrl: this.dashboardUrl,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Goal milestone email sent to ${payload.to} for: ${payload.goalName}`);
    } catch (error) {
      this.logger.error(`Failed to send goal milestone email to ${payload.to}`, error.stack);
    }
  }
}
