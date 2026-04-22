import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GoalRepository } from '../../repositories/goal.repository';
import { CreateGoalDto } from '../../dto/create-goal.dto';
import { UpdateGoalDto } from '../../dto/update-goal.dto';
import { AddFundsDto } from '../../dto/add-funds.dto';
import { GoalDocument, GoalStatus } from '../../schemas/goal.schema';

@Injectable()
export class GoalService {
  constructor(private readonly repository: GoalRepository) {}

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

    const newAmount = goal.currentAmount + dto.amount;
    let status: GoalStatus = goal.status as GoalStatus;

    if (newAmount >= goal.targetAmount) {
      status = GoalStatus.ACHIEVED;
      // Note: We could dispatch a congratulations email here via MailService!
    }

    const updated = await this.repository.update(userId, goalId, {
      currentAmount: newAmount,
      status,
    } as any);

    if (!updated) throw new NotFoundException('Goal not found');
    return updated;
  }

  async remove(userId: string, goalId: string): Promise<void> {
    const deleted = await this.repository.delete(userId, goalId);
    if (!deleted) {
      throw new NotFoundException(`Goal ${goalId} not found`);
    }
  }
}
