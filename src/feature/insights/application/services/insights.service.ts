/**
 * InsightsService
 *
 * Provides financial forecasting and AI-like insights using
 * historical expense/income data. Uses weighted moving averages
 * and trend analysis for predictions.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Expense, ExpenseDocument } from '../../../../feature/expenses/schemas/expense.schema';
import { Income, IncomeDocument } from '../../../../feature/incomes/schemas/income.schema';
import { Goal, GoalDocument, GoalStatus } from '../../../../feature/goals/schemas/goal.schema';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(Income.name) private readonly incomeModel: Model<IncomeDocument>,
    @InjectModel(Goal.name) private readonly goalModel: Model<GoalDocument>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * GET /insights/forecast
   * Predicts next month's spending per category using weighted moving average (last 3 months)
   */
  async getSpendingForecast(userId: string) {
    const now = new Date();

    // Get last 3 months of data
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const monthlyByCategory = await this.expenseModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          date: { $gte: threeMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            category: '$category',
            month: { $dateToString: { format: '%Y-%m', date: '$date' } },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // Group by category and compute weighted average
    const categoryMap: Record<string, number[]> = {};
    for (const item of monthlyByCategory) {
      const cat = item._id.category;
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(item.total);
    }

    const forecasts = Object.entries(categoryMap).map(([category, amounts]) => {
      // Weighted average: recent months matter more (weights: 1, 2, 3)
      const weights = amounts.length === 1 ? [1] :
                      amounts.length === 2 ? [1, 2] : [1, 2, 3];
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      
      let weightedSum = 0;
      const recentAmounts = amounts.slice(-3); // Take last 3
      for (let i = 0; i < recentAmounts.length; i++) {
        weightedSum += recentAmounts[i] * weights[i];
      }
      
      const predicted = Math.round(weightedSum / totalWeight);
      const avgActual = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length);

      return {
        category,
        predictedAmount: predicted,
        averageAmount: avgActual,
        trend: predicted > avgActual ? 'increasing' : predicted < avgActual ? 'decreasing' : 'stable',
        monthsOfData: amounts.length,
      };
    });

    // Sort by predicted amount descending
    forecasts.sort((a, b) => b.predictedAmount - a.predictedAmount);

    const totalPredicted = forecasts.reduce((sum, f) => sum + f.predictedAmount, 0);

    return {
      nextMonth: this.getNextMonthName(),
      totalPredictedSpending: totalPredicted,
      categoryForecasts: forecasts,
    };
  }

  /**
   * GET /insights/savings-rate
   * Monthly savings rate: (Income - Expenses) / Income * 100
   */
  async getSavingsRate(userId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const [expensesByMonth, incomesByMonth] = await Promise.all([
      this.expenseModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId), date: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ]),
      this.incomeModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId), date: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Merge into a single timeline
    const months = new Set([
      ...expensesByMonth.map(e => e._id),
      ...incomesByMonth.map(i => i._id),
    ]);

    const timeline = Array.from(months).sort().map(month => {
      const expense = expensesByMonth.find(e => e._id === month)?.total || 0;
      const income = incomesByMonth.find(i => i._id === month)?.total || 0;
      const savings = income - expense;
      const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

      return {
        month,
        income: Math.round(income),
        expense: Math.round(expense),
        savings: Math.round(savings),
        savingsRate,
      };
    });

    const avgSavingsRate = timeline.length > 0
      ? Math.round(timeline.reduce((sum, t) => sum + t.savingsRate, 0) / timeline.length)
      : 0;

    return {
      averageSavingsRate: avgSavingsRate,
      recommendation: this.getSavingsRecommendation(avgSavingsRate),
      monthlyBreakdown: timeline,
    };
  }

  /**
   * GET /insights/goal-predictions
   * Predicts when each active goal will be achieved based on average monthly savings
   */
  async getGoalPredictions(userId: string) {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    // Calculate average monthly net savings
    const [expenseTotal, incomeTotal] = await Promise.all([
      this.expenseModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId), date: { $gte: threeMonthsAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.incomeModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId), date: { $gte: threeMonthsAgo } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalExpenses = expenseTotal[0]?.total || 0;
    const totalIncome = incomeTotal[0]?.total || 0;
    const monthlySavings = Math.max(0, (totalIncome - totalExpenses) / 3);

    // Get active goals
    const activeGoals = await this.goalModel.find({
      userId,
      status: GoalStatus.IN_PROGRESS,
    }).exec();

    const predictions = activeGoals.map(goal => {
      const remaining = goal.targetAmount - goal.currentAmount;
      const percentComplete = Math.round((goal.currentAmount / goal.targetAmount) * 100);

      let estimatedMonths: number | null = null;
      let estimatedDate: string | null = null;
      let onTrack = false;

      if (monthlySavings > 0) {
        estimatedMonths = Math.ceil(remaining / monthlySavings);
        const predictedDate = new Date(now);
        predictedDate.setMonth(predictedDate.getMonth() + estimatedMonths);
        estimatedDate = predictedDate.toISOString().split('T')[0];
        onTrack = predictedDate <= new Date(goal.deadline);
      }

      return {
        goalId: goal._id,
        goalName: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        remainingAmount: remaining,
        percentComplete,
        deadline: goal.deadline,
        estimatedMonths,
        estimatedCompletionDate: estimatedDate,
        onTrack,
        color: goal.color,
      };
    });

    return {
      averageMonthlySavings: Math.round(monthlySavings),
      predictions,
    };
  }

  /**
   * GET /insights/cashflow
   * Net cash flow (income - expenses) per month for the last 6 months
   */
  async getCashFlow(userId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const [expenses, incomes] = await Promise.all([
      this.expenseModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId), date: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ]),
      this.incomeModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId), date: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const months = new Set([
      ...expenses.map(e => e._id),
      ...incomes.map(i => i._id),
    ]);

    const cashflow = Array.from(months).sort().map(month => {
      const expense = expenses.find(e => e._id === month)?.total || 0;
      const income = incomes.find(i => i._id === month)?.total || 0;
      return {
        month,
        income: Math.round(income),
        expense: Math.round(expense),
        netCashFlow: Math.round(income - expense),
      };
    });

    return { cashflow };
  }

  /**
   * GET /insights/investments
   * Generates AI-based investment suggestions based on available monthly savings
   */
  async getInvestmentSuggestions(userId: string) {
    // 1. Find average savings
    const savingsData = await this.getSavingsRate(userId);
    const timeline = savingsData.monthlyBreakdown;
    
    // Average savings over the available timeline, minimum 0
    const avgSavings = timeline.length > 0
      ? Math.max(0, timeline.reduce((sum, t) => sum + t.savings, 0) / timeline.length)
      : 0;

    // Default mock response if AI is not available
    let suggestions = [
      {
        title: 'High-Yield Savings Account',
        description: 'A safe place to store your emergency fund while earning 4-5% APY.',
        riskLevel: 'Low',
        expectedReturn: '4-5% APY',
      },
      {
        title: 'S&P 500 Index Funds',
        description: 'Invest in the top 500 US companies for steady long-term growth.',
        riskLevel: 'Medium',
        expectedReturn: '8-10% Annual',
      },
      {
        title: 'Cryptocurrency (Bitcoin/Ethereum)',
        description: 'High volatility digital assets with potential for massive upside.',
        riskLevel: 'High',
        expectedReturn: 'Highly Variable',
      }
    ];

    let aiInsight = `Based on your recent transaction history, you are saving approximately ₹${avgSavings.toLocaleString()} per month.`;

    if (this.genAI && avgSavings > 0) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        const prompt = `The user is saving roughly ${avgSavings} of their local currency per month.
Provide exactly 3 investment vehicles they should consider. Output ONLY a raw JSON array. Do not use markdown tags.
Each object must have the fields: "title" (string), "description" (string, 1-2 sentences), "riskLevel" (string: Low, Medium, or High), and "expectedReturn" (string, e.g. "8-10% Annual").`;
        
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        suggestions = JSON.parse(text);
        
        const insightPrompt = `The user is saving ${avgSavings} per month. Give a 2-sentence encouraging, highly actionable financial insight on why investing this amount is powerful over a 10 year horizon.`;
        const insightResult = await model.generateContent(insightPrompt);
        aiInsight = insightResult.response.text().trim();
      } catch (err) {
        this.logger.error('Failed to generate AI investment suggestions', err);
      }
    }

    return {
      availableMonthlySavings: avgSavings,
      aiInsight,
      suggestions,
      popularPlatforms: [
        { name: 'Zerodha', type: 'Stocks & Mutual Funds', url: 'https://zerodha.com' },
        { name: 'Groww', type: 'Stocks & Mutual Funds', url: 'https://groww.in' },
        { name: 'Vanguard', type: 'Index Funds', url: 'https://investor.vanguard.com' },
        { name: 'Coinbase', type: 'Cryptocurrency', url: 'https://coinbase.com' }
      ]
    };
  }

  // ==================== Helpers ====================

  private getNextMonthName(): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const nextMonth = (new Date().getMonth() + 1) % 12;
    return months[nextMonth];
  }

  private getSavingsRecommendation(rate: number): string {
    if (rate >= 30) return '🌟 Excellent! You are saving aggressively. Keep it up!';
    if (rate >= 20) return '✅ Great savings rate. You are on a solid financial path.';
    if (rate >= 10) return '👍 Decent, but try to cut discretionary spending to boost savings.';
    if (rate > 0) return '⚠️ Your savings rate is low. Review your expenses for optimization.';
    return '🚨 You are spending more than you earn. Immediate action needed!';
  }
}
