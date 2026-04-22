import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Budget, BudgetDocument } from '../schemas/budget.schema';

@Injectable()
export class BudgetRepository {
  constructor(
    @InjectModel(Budget.name)
    private readonly budgetModel: Model<BudgetDocument>,
  ) {}

  async create(data: Partial<Budget>): Promise<BudgetDocument> {
    const budget = new this.budgetModel(data);
    return budget.save();
  }

  async findById(budgetId: string, userId: string): Promise<BudgetDocument | null> {
    return this.budgetModel.findOne({ _id: budgetId, userId }).exec();
  }

  async findByMonthYear(userId: string, month: number, year: number): Promise<BudgetDocument[]> {
    return this.budgetModel.find({ userId, month, year }).exec();
  }

  async findByCategoryAndMonth(
    userId: string,
    category: string,
    month: number,
    year: number,
  ): Promise<BudgetDocument | null> {
    return this.budgetModel.findOne({ userId, category, month, year }).exec();
  }

  async update(budgetId: string, userId: string, data: Partial<Budget>): Promise<BudgetDocument | null> {
    return this.budgetModel
      .findOneAndUpdate({ _id: budgetId, userId }, data, { new: true })
      .exec();
  }

  async delete(budgetId: string, userId: string): Promise<boolean> {
    const result = await this.budgetModel.deleteOne({ _id: budgetId, userId }).exec();
    return result.deletedCount === 1;
  }

  /**
   * Calculates actual spent amounts for each budget by aggregating from the expenses collection
   */
  async getBudgetsWithSpent(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.budgetModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), month, year } },
      {
        $lookup: {
          from: 'expenses',
          let: { budgetCategory: '$category', budgetUserId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$budgetUserId'] },
                    { $eq: ['$category', '$$budgetCategory'] },
                    { $gte: ['$date', startDate] },
                    { $lte: ['$date', endDate] },
                  ],
                },
              },
            },
            { $group: { _id: null, totalSpent: { $sum: '$amount' } } },
          ],
          as: 'expenseData',
        },
      },
      {
        $addFields: {
          spentAmount: { $ifNull: [{ $arrayElemAt: ['$expenseData.totalSpent', 0] }, 0] },
          percentUsed: {
            $cond: {
              if: { $gt: ['$limitAmount', 0] },
              then: {
                $round: [
                  { $multiply: [{ $divide: [{ $ifNull: [{ $arrayElemAt: ['$expenseData.totalSpent', 0] }, 0] }, '$limitAmount'] }, 100] },
                  1,
                ],
              },
              else: 0,
            },
          },
        },
      },
      {
        $addFields: {
          status: {
            $cond: {
              if: { $gte: ['$percentUsed', 100] },
              then: 'EXCEEDED',
              else: {
                $cond: {
                  if: { $gte: ['$percentUsed', '$alertThreshold'] },
                  then: 'WARNING',
                  else: 'ON_TRACK',
                },
              },
            },
          },
        },
      },
      { $project: { expenseData: 0 } },
    ]);
  }
}
