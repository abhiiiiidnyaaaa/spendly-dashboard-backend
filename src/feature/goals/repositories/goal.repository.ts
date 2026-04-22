import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Goal, GoalDocument, GoalStatus } from '../schemas/goal.schema';
import { CreateGoalDto } from '../dto/create-goal.dto';

@Injectable()
export class GoalRepository {
  constructor(
    @InjectModel(Goal.name) private readonly goalModel: Model<GoalDocument>,
  ) {}

  async create(userId: string, data: CreateGoalDto): Promise<GoalDocument> {
    const goal = new this.goalModel({
      ...data,
      userId,
    });
    return goal.save();
  }

  async findAllByUser(userId: string): Promise<GoalDocument[]> {
    return this.goalModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findById(userId: string, goalId: string): Promise<GoalDocument | null> {
    return this.goalModel.findOne({ _id: goalId, userId }).exec();
  }

  async update(
    userId: string,
    goalId: string,
    data: Partial<Goal>,
  ): Promise<GoalDocument | null> {
    return this.goalModel
      .findOneAndUpdate({ _id: goalId, userId }, data, { new: true })
      .exec();
  }

  async delete(userId: string, goalId: string): Promise<boolean> {
    const result = await this.goalModel.deleteOne({ _id: goalId, userId }).exec();
    return result.deletedCount === 1;
  }
}
