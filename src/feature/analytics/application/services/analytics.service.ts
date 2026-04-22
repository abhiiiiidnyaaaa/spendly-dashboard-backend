import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense, ExpenseDocument } from '../../../expenses/schemas/expense.schema';
import { Income, IncomeDocument } from '../../../incomes/schemas/income.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Expense.name)
    private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(Income.name)
    private readonly incomeModel: Model<IncomeDocument>,
  ) {}

  /**
   * Retrieves a high-level summary: Total Spent this month vs last month
   */
  async getSummary(userId: string) {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonthResult, lastMonthResult, totalResult, incomeResult] = await Promise.all([
      this.expenseModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId), date: { $gte: firstDayThisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.expenseModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId), date: { $gte: firstDayLastMonth, $lt: firstDayThisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.expenseModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.incomeModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const allTimeExpense = totalResult[0]?.total || 0;
    const allTimeIncome = incomeResult[0]?.total || 0;

    return {
      thisMonthTotal: thisMonthResult[0]?.total || 0,
      lastMonthTotal: lastMonthResult[0]?.total || 0,
      allTimeTotal: allTimeExpense,
      allTimeIncome: allTimeIncome,
      netProfit: allTimeIncome - allTimeExpense,
    };
  }

  /**
   * Aggregates expenses by category (e.g., for a Pie Chart)
   */
  async getCategoryBreakdown(userId: string) {
    const breakdown = await this.expenseModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    return breakdown.map(item => ({
      category: item._id,
      total: item.total,
      count: item.count,
    }));
  }

  /**
   * Aggregates expenses grouped by month (e.g., for a Bar Chart trendline)
   */
  async getMonthlyTrend(userId: string) {
    const trend = await this.expenseModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return trend.map(item => ({
      month: item._id,
      total: item.total,
    }));
  }
}
