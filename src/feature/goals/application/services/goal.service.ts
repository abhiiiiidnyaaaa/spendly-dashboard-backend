import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { GoalRepository } from '../../repositories/goal.repository';
import { CreateGoalDto } from '../../dto/create-goal.dto';
import { UpdateGoalDto } from '../../dto/update-goal.dto';
import { AddFundsDto } from '../../dto/add-funds.dto';
import { GoalDocument, GoalStatus } from '../../schemas/goal.schema';
import { MailService } from '../../../../feature/mail/application/services/mail.service';
import { UserService } from '../../../../feature/users/application/services/user.service';
import { NotificationService } from '../../../../feature/notifications/application/services/notification.service';
import { GamificationService } from '../../../../feature/gamification/application/services/gamification/gamification.service';

@Injectable()
export class GoalService {
  private readonly logger = new Logger(GoalService.name);

  constructor(
    private readonly repository: GoalRepository,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly gamificationService: GamificationService,
  ) {}

  async create(userId: string, dto: CreateGoalDto): Promise<GoalDocument> {
    // Determine status automatically if they initialized it with enough funds
    if (dto.currentAmount && dto.currentAmount >= dto.targetAmount) {
      throw new BadRequestException('Current amount cannot be greater than or equal to target amount at creation.');
    }
    return this.repository.create(userId, dto);
  }

  async findAll(userId: string): Promise<GoalDocument[]> {
    return this.repository.findAllByUser(userId);
  }

  async findOne(userId: string, goalId: string): Promise<GoalDocument> {
    const goal = await this.repository.findById(userId, goalId);
    if (!goal) {
      throw new NotFoundException(`Goal ${goalId} not found`);
    }
    return goal;
  }

  async update(userId: string, goalId: string, dto: UpdateGoalDto): Promise<GoalDocument> {
    await this.findOne(userId, goalId); // Ensure it exists
    
    const updateData: any = { ...dto };
    if (dto.deadline) {
      updateData.deadline = new Date(dto.deadline);
    }
    
    const updated = await this.repository.update(userId, goalId, updateData);
    if (!updated) throw new NotFoundException('Goal not found');
    return updated;
  }

  async addFunds(userId: string, goalId: string, dto: AddFundsDto): Promise<GoalDocument> {
    const goal = await this.findOne(userId, goalId);
    
    if (goal.status === GoalStatus.ACHIEVED) {
      throw new BadRequestException('This goal is already achieved!');
    }

    const oldAmount = goal.currentAmount;
    const newAmount = goal.currentAmount + dto.amount;
    let status: GoalStatus = goal.status as GoalStatus;

    if (newAmount >= goal.targetAmount) {
      status = GoalStatus.ACHIEVED;
    }

    const updated = await this.repository.update(userId, goalId, {
      currentAmount: newAmount,
      status,
    } as any);

    if (!updated) throw new NotFoundException('Goal not found');

    // Milestone Check: 50% or 100%
    try {
      const oldPercent = (oldAmount / goal.targetAmount) * 100;
      const newPercent = (newAmount / goal.targetAmount) * 100;

      // Send if they just crossed 50% (but weren't already at or above 50%)
      const crossed50 = oldPercent < 50 && newPercent >= 50 && newPercent < 100;
      // Send if they just hit 100%
      const hit100 = newPercent >= 100;

      if (crossed50 || hit100) {
        // Real-time in-app notification
        this.notificationService.notifyGoalMilestone(userId, goal.name, newPercent);

        if (hit100) {
          // Gamification Check
          await this.gamificationService.checkGoalAchievedBadge(userId);
        }

        // Email notification
        const user = await this.userService.findById(userId);
        if (user) {
          this.mailService.sendGoalMilestoneEmail({
            to: user.email,
            name: user.name,
            goalName: goal.name,
            targetAmount: goal.targetAmount,
            currentAmount: newAmount,
            percentAchieved: newPercent,
            currency: goal.currency,
          });
        }
      }
    } catch (err) {
      this.logger.error(`Failed to send milestone notification for goal ${goalId}`, err);
    }

    return updated;
  }

  async remove(userId: string, goalId: string): Promise<void> {
    const deleted = await this.repository.delete(userId, goalId);
    if (!deleted) {
      throw new NotFoundException(`Goal ${goalId} not found`);
    }
  }
}
