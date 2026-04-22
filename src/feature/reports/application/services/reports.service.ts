/**
 * ReportsService
 *
 * Generates downloadable CSV reports of user expenses.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../../../expenses/schemas/expense.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  /**
   * Generates a CSV string of all expenses for the user within a date range
   */
  async generateExpenseCsv(
    userId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<string> {
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await this.expenseModel
      .find(filter)
      .sort({ date: -1 })
      .lean()
      .exec();

    // Build CSV
    const headers = ['Date', 'Category', 'Amount', 'Description'];
    const rows = expenses.map((exp) => {
      const date = new Date(exp.date).toISOString().split('T')[0];
      const category = `"${(exp.category || '').replace(/"/g, '""')}"`;
      const amount = exp.amount.toFixed(2);
      const description = `"${(exp.description || '').replace(/"/g, '""')}"`;
      return [date, category, amount, description].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Generates a JSON summary report
   */
  async generateSummaryReport(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const [summary, categoryBreakdown] = await Promise.all([
      this.expenseModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            maxExpense: { $max: '$amount' },
            minExpense: { $min: '$amount' },
          },
        },
      ]),
      this.expenseModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    return {
      overview: summary[0] || {
        totalExpenses: 0,
        totalAmount: 0,
        avgAmount: 0,
        maxExpense: 0,
        minExpense: 0,
      },
      categoryBreakdown: categoryBreakdown.map((item) => ({
        category: item._id,
        total: item.total,
        count: item.count,
      })),
      dateRange: {
        from: startDate || 'All time',
        to: endDate || 'Present',
      },
    };
  }
}
