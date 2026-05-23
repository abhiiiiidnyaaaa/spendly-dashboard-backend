import { Injectable, Logger } from '@nestjs/common';
import { CreateExpenseDto } from '../../dto/create-expense.dto';
import { ExpenseDocument } from '../../schemas/expense.schema';
import { ExpenseRepository } from '../../repositories/expense.repository';
import { MailService } from '../../../mail/application/services/mail.service';
import { UserService } from '../../../users/application/services/user.service';
import { BudgetService } from '../../../budgets/application/services/budget.service';
import { NotificationService } from '../../../notifications/application/services/notification.service';
import { GamificationService } from '../../../gamification/application/services/gamification/gamification.service';
import { CurrencyService } from '../../../../common/services/currency.service';

@Injectable()
export class CreateExpenseUseCase {
  private readonly logger = new Logger(CreateExpenseUseCase.name);

  constructor(
    private readonly repository: ExpenseRepository,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly budgetService: BudgetService,
    private readonly notificationService: NotificationService,
    private readonly gamificationService: GamificationService,
    private readonly currencyService: CurrencyService,
  ) {}

  async execute(
    userId: string,
    dto: CreateExpenseDto,
  ): Promise<ExpenseDocument> {
    const user = await this.userService.findById(userId);
    const baseCurrency = user?.baseCurrency || 'INR';
    const currency = dto.currency?.toUpperCase() || 'INR';
    const baseAmount = await this.currencyService.convert(dto.amount, currency, baseCurrency);

    const expense = await this.repository.create({
      ...dto,
      date: new Date(dto.date),
      category: dto.category.trim(),
      description: dto.description?.trim() || '',
      currency,
      baseAmount,
      userId,
    });
    
    // Check budget alert
    try {
      const date = new Date(dto.date);
      const budgets = await this.budgetService.findByMonthWithSpent(userId, date.getMonth() + 1, date.getFullYear());
      
      const categoryBudget = budgets.find(b => b.category === expense.category);
      if (user && categoryBudget && categoryBudget.limitAmount > 0) {
        const percentUsed = (categoryBudget.spentAmount / categoryBudget.limitAmount) * 100;
        
        // If alert threshold exceeded, emit an email
        if (percentUsed >= categoryBudget.alertThreshold) {
          this.logger.warn(`Budget alert for User [${userId}] on category [${expense.category}]. Used: ${percentUsed.toFixed(1)}%`);
          
          // Real-time in-app notification
          this.notificationService.notifyBudgetAlert(userId, categoryBudget.category, percentUsed);

          // Email notification
          this.mailService.sendBudgetAlertEmail({
            to: user.email,
            name: user.name,
            category: categoryBudget.category,
            spentAmount: categoryBudget.spentAmount,
            limitAmount: categoryBudget.limitAmount,
            percentUsed: percentUsed,
            currency: user.baseCurrency,
            month: categoryBudget.month,
            year: categoryBudget.year,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process budget alert check for expense`, error);
    }
    
    // Check gamification streaks and badges
    await this.gamificationService.updateStreakOnExpenseAdded(userId);

    return expense;
  }
}
