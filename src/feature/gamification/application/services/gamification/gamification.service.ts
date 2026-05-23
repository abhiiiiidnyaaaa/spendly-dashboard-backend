import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../../../users/schemas/user.schema';
import { NotificationService } from '../../../../notifications/application/services/notification.service';

export const BADGES = {
  FIRST_EXPENSE: 'FIRST_EXPENSE',
  BUDGET_MASTER: 'BUDGET_MASTER',
  GOAL_CRUSHER: 'GOAL_CRUSHER',
  WEEK_STREAK: 'WEEK_STREAK',
  MONTH_STREAK: 'MONTH_STREAK',
};

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Updates the user's streak when they log an expense.
   * If they log an expense on consecutive days, their streak goes up.
   * If they miss a day, it resets to 1.
   */
  async updateStreakOnExpenseAdded(userId: string): Promise<void> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) return;

      const now = new Date();
      const lastLogin = user.lastLoginDate;

      if (!lastLogin) {
        // First time ever logging an expense
        user.currentStreak = 1;
        user.lastLoginDate = now;
        await this.checkAndAwardBadge(user, BADGES.FIRST_EXPENSE);
      } else {
        const diffInTime = now.getTime() - lastLogin.getTime();
        const diffInDays = diffInTime / (1000 * 3600 * 24);

        if (diffInDays > 0.5 && diffInDays < 1.5) {
          // It's the next day (consecutive)
          user.currentStreak += 1;
          user.lastLoginDate = now;
        } else if (diffInDays >= 1.5) {
          // Missed a day
          user.currentStreak = 1;
          user.lastLoginDate = now;
        } else {
          // Same day (diffInDays <= 0.5), don't increment streak, but update last login to now
          user.lastLoginDate = now;
        }
      }

      await user.save();

      // Check for streak-based badges
      if (user.currentStreak === 7) {
        await this.checkAndAwardBadge(user, BADGES.WEEK_STREAK);
      } else if (user.currentStreak === 30) {
        await this.checkAndAwardBadge(user, BADGES.MONTH_STREAK);
      }
    } catch (error) {
      this.logger.error(`Error updating streak for user ${userId}:`, error);
    }
  }

  /**
   * Awards a badge to a user if they don't already have it.
   */
  async checkAndAwardBadge(user: UserDocument, badge: string): Promise<void> {
    if (!user.badges) {
      user.badges = [];
    }
    
    if (!user.badges.includes(badge)) {
      user.badges.push(badge);
      await user.save();
      
      this.logger.log(`User ${user._id} awarded badge: ${badge}`);
      
      // Notify the user in real-time
      this.notificationService.notifyNewBadge(user._id.toString(), badge);
    }
  }

  /**
   * Called when a goal is fully achieved.
   */
  async checkGoalAchievedBadge(userId: string): Promise<void> {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) return;
      await this.checkAndAwardBadge(user, BADGES.GOAL_CRUSHER);
    } catch (error) {
      this.logger.error(`Error awarding goal badge for user ${userId}:`, error);
    }
  }
}
