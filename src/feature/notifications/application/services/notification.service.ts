/**
 * NotificationService
 *
 * Creates notifications in MongoDB AND pushes them in real-time via WebSocket.
 * This is the single entry point for all notification dispatching across the app.
 */

import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from '../../repositories/notification.repository';
import { NotificationsGateway } from '../../gateways/notifications.gateway';
import { NotificationDocument, NotificationType } from '../../schemas/notification.schema';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly repository: NotificationRepository,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Create a notification, persist it, and push it in real-time
   */
  async notify(payload: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, any>;
  }): Promise<NotificationDocument> {
    // 1. Persist to MongoDB
    const notification = await this.repository.create(payload);

    // 2. Push via WebSocket
    this.gateway.sendToUser(payload.userId, 'newNotification', {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      metadata: notification.metadata,
      createdAt: (notification as any).createdAt,
    });

    this.logger.log(`Notification sent to user ${payload.userId}: ${payload.title}`);
    return notification;
  }

  // ==================== Convenience Methods ====================

  async notifyBudgetAlert(userId: string, category: string, percentUsed: number) {
    return this.notify({
      userId,
      title: '⚠️ Budget Alert',
      message: `You've used ${Math.round(percentUsed)}% of your ${category} budget this month.`,
      type: NotificationType.BUDGET_ALERT,
      metadata: { category, percentUsed },
    });
  }

  async notifySubscriptionRenewal(userId: string, subscriptionName: string, amount: number, currency: string) {
    return this.notify({
      userId,
      title: '🔔 Subscription Renewed',
      message: `Your subscription "${subscriptionName}" was auto-billed for ${currency} ${amount.toLocaleString()}.`,
      type: NotificationType.SUBSCRIPTION_RENEWAL,
      metadata: { subscriptionName, amount, currency },
    });
  }

  async notifyGoalMilestone(userId: string, goalName: string, percentAchieved: number) {
    const isComplete = percentAchieved >= 100;
    return this.notify({
      userId,
      title: isComplete ? '🏆 Goal Achieved!' : '🎯 Halfway There!',
      message: isComplete
        ? `Congratulations! You've completed your "${goalName}" savings goal!`
        : `You're ${Math.round(percentAchieved)}% of the way to your "${goalName}" goal. Keep going!`,
      type: isComplete ? NotificationType.GOAL_ACHIEVED : NotificationType.GOAL_MILESTONE,
      metadata: { goalName, percentAchieved },
    });
  }

  async notifyNewBadge(userId: string, badgeName: string) {
    return this.notify({
      userId,
      title: '🏅 New Badge Unlocked!',
      message: `Congratulations! You just unlocked the ${badgeName} badge!`,
      type: NotificationType.NEW_BADGE,
      metadata: { badgeName },
    });
  }

  // ==================== Read Operations ====================

  async getUserNotifications(userId: string, limit = 20): Promise<NotificationDocument[]> {
    return this.repository.findByUser(userId, limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.repository.countUnread(userId);
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationDocument | null> {
    return this.repository.markAsRead(userId, notificationId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    return this.repository.markAllAsRead(userId);
  }
}
