/**
 * ExpenseRepository
 *
 * Deals with all Mongoose queries for the Expense model.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Expense, ExpenseDocument } from '../schemas/expense.schema';
import { QueryExpenseDto } from '../dto/query-expense.dto';

@Injectable()
export class ExpenseRepository {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  async create(data: Partial<Expense>): Promise<ExpenseDocument> {
    const expense = new this.expenseModel(data);
    return expense.save();
  }

  async findById(
    expenseId: string,
    userId: string,
  ): Promise<ExpenseDocument | null> {
    return this.expenseModel.findOne({ _id: expenseId, userId }).exec();
  }

  async findAll(userId: string, queryDto: QueryExpenseDto) {
    const { page = 1, limit = 20, category, startDate, endDate } = queryDto;

    const filter: any = { userId };

    if (category) {
      filter.category = new RegExp(category, 'i');
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.expenseModel
        .find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.expenseModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(
    expenseId: string,
    userId: string,
    data: Partial<Expense>,
  ): Promise<ExpenseDocument | null> {
    return this.expenseModel
      .findOneAndUpdate({ _id: expenseId, userId }, data, { new: true })
      .exec();
  }

  async delete(expenseId: string, userId: string): Promise<boolean> {
    const result = await this.expenseModel
      .deleteOne({ _id: expenseId, userId })
      .exec();
    return result.deletedCount === 1;
  }
}
