/**
 * AiChatService
 *
 * Fetches the user's financial data (expenses, incomes, budgets, goals),
 * builds a secure prompt, and sends it to Google Gemini for personalized
 * financial advice in a conversational format.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Expense, ExpenseDocument } from '../../../expenses/schemas/expense.schema';
import { ExpenseService } from '../../../expenses/application/services/expense.service';
import { IncomeService } from '../../../incomes/application/services/income.service';
import { Income, IncomeDocument } from '../../../incomes/schemas/income.schema';
import { Goal, GoalDocument } from '../../../goals/schemas/goal.schema';
import { User, UserDocument } from '../../../users/schemas/user.schema';
import { AiChatSession, AiChatSessionDocument } from '../../schemas/ai-chat-session.schema';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly expenseService: ExpenseService,
    private readonly incomeService: IncomeService,
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
    @InjectModel(Income.name) private readonly incomeModel: Model<IncomeDocument>,
    @InjectModel(Goal.name) private readonly goalModel: Model<GoalDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AiChatSession.name) private readonly chatSessionModel: Model<AiChatSessionDocument>,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('Google Gemini AI initialized successfully');
    } else {
      this.logger.warn('GEMINI_API_KEY not configured. AI Chat will use fallback mode.');
    }
  }

  /**
   * Retrieves the user's persistent chat history.
   */
  async getHistory(userId: string): Promise<AiChatSessionDocument> {
    let session = await this.chatSessionModel.findOne({ userId });
    if (!session) {
      session = await this.chatSessionModel.create({ userId, history: [] });
    }
    return session;
  }

  /**
   * Main entry point: takes a user's question and returns AI-powered advice.
   */
  async chat(userId: string, userMessage: string, historyDto?: any[]): Promise<{ reply: string }> {
    try {
      // 1. Gather the user's financial context
      const context = await this.buildFinancialContext(userId);

      // 2. If Gemini is not configured, use the smart fallback
      if (!this.genAI) {
        return { reply: this.generateFallbackResponse(userMessage, context) };
      }

      // 3. Build the prompt and call Gemini
      const systemPrompt = this.buildSystemPrompt(context);

      const logExpenseTool = {
        functionDeclarations: [
          {
            name: 'log_expense',
            description: 'Logs a new expense in the user\'s financial tracker database.',
            parameters: {
              type: 'OBJECT',
              properties: {
                amount: { type: 'NUMBER', description: 'The amount of the expense' },
                category: { type: 'STRING', description: 'The category (e.g. Food, Transport, Utilities, Shopping)' },
                description: { type: 'STRING', description: 'A brief description of the expense' },
              },
              required: ['amount', 'category'],
            },
          },
        ],
      };

      const logIncomeTool = {
        functionDeclarations: [
          {
            name: 'log_income',
            description: 'Logs a new income in the user\'s financial tracker database.',
            parameters: {
              type: 'OBJECT',
              properties: {
                amount: { type: 'NUMBER', description: 'The amount of the income' },
                source: { type: 'STRING', description: 'The source of income (e.g. Salary, Freelance, Investment, Gift)' },
                description: { type: 'STRING', description: 'A brief description of the income' },
              },
              required: ['amount', 'source'],
            },
          },
        ],
      };

      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-flash-latest',
        tools: [logExpenseTool as any, logIncomeTool as any],
        systemInstruction: systemPrompt,
      });

      // Pass history to the chat session
      const session = await this.getHistory(userId);
      const chatSession = model.startChat({
        history: session.history.map(h => ({ role: h.role === 'ai' ? 'model' : h.role, parts: [{ text: h.parts }] })),
      });

      const result = await chatSession.sendMessage(userMessage);
      const response = result.response;

      // Save user message to DB
      session.history.push({ role: 'user', parts: userMessage, timestamp: new Date() } as any);

      let reply = response.text() || 'Sorry, I could not generate a response. Please try again.';

      // Handle function calling
      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === 'log_expense') {
          const { amount, category, description } = call.args as any;
          await this.expenseService.create(userId, {
            amount: Number(amount),
            category,
            description: description || '',
            date: new Date().toISOString(),
          } as any);
          reply = `✅ I have successfully logged an expense of **${context.currency} ${amount}** for **${category}**.`;
        } else if (call.name === 'log_income') {
          const { amount, source, description } = call.args as any;
          await this.incomeService.create(userId, {
            amount: Number(amount),
            source,
            description: description || '',
            date: new Date().toISOString(),
          } as any);
          reply = `✅ I have successfully logged an income of **${context.currency} ${amount}** from **${source}**.`;
        }
      }

      // Save AI message to DB
      session.history.push({ role: 'model', parts: reply, timestamp: new Date() } as any);
      await session.save();

      return { reply };
    } catch (error) {
      this.logger.error(`AI Chat error for user ${userId}:`, error);

      // Fallback to smart response if Gemini fails
      const context = await this.buildFinancialContext(userId);
      return { reply: this.generateFallbackResponse(userMessage, context) };
    }
  }

  /**
   * Gathers the user's last 3 months of financial data.
   */
  private async buildFinancialContext(userId: string) {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const userObjectId = new Types.ObjectId(userId);

    const [user, recentExpenses, recentIncomes, goals, thisMonthExpenses, thisMonthIncomes] = await Promise.all([
      this.userModel.findById(userId).select('name baseCurrency planTier'),
      this.expenseModel.find({ userId: userObjectId as any, date: { $gte: threeMonthsAgo } }).sort({ date: -1 }).limit(50).lean(),
      this.incomeModel.find({ userId: userObjectId as any, date: { $gte: threeMonthsAgo } }).sort({ date: -1 }).limit(20).lean(),
      this.goalModel.find({ userId }).lean(),
      this.expenseModel.aggregate([
        { $match: { userId: userObjectId, date: { $gte: thisMonthStart } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      this.incomeModel.aggregate([
        { $match: { userId: userObjectId, date: { $gte: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalExpensesThisMonth = thisMonthExpenses.reduce((sum, cat) => sum + cat.total, 0);
    const totalIncomeThisMonth = thisMonthIncomes[0]?.total || 0;

    const totalExpenses3Months = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome3Months = recentIncomes.reduce((sum, i) => sum + i.amount, 0);

    // Category breakdown for this month
    const categoryBreakdown = thisMonthExpenses.map(cat => ({
      category: cat._id,
      amount: Math.round(cat.total),
      count: cat.count,
    }));

    // Top spending categories across 3 months
    const categoryTotals: Record<string, number> = {};
    for (const exp of recentExpenses) {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    }
    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount: Math.round(amount) }));

    return {
      userName: user?.name || 'User',
      currency: user?.baseCurrency || 'INR',
      plan: user?.planTier || 'FREE',
      thisMonth: {
        totalExpenses: Math.round(totalExpensesThisMonth),
        totalIncome: Math.round(totalIncomeThisMonth),
        netSavings: Math.round(totalIncomeThisMonth - totalExpensesThisMonth),
        categoryBreakdown,
      },
      threeMonths: {
        totalExpenses: Math.round(totalExpenses3Months),
        totalIncome: Math.round(totalIncome3Months),
        avgMonthlyExpense: Math.round(totalExpenses3Months / 3),
        avgMonthlyIncome: Math.round(totalIncome3Months / 3),
        topCategories,
      },
      goals: goals.map(g => ({
        name: g.name,
        target: g.targetAmount,
        current: g.currentAmount,
        status: g.status,
        deadline: g.deadline,
      })),
      recentExpenseCount: recentExpenses.length,
    };
  }

  /**
   * Builds the system prompt with real financial data injected.
   */
  private buildSystemPrompt(context: any): string {
    return `You are "Spendly AI", a friendly and knowledgeable personal finance assistant built into the Spendly finance tracking app. 

You have access to the user's REAL financial data. Here it is:

**User:** ${context.userName}
**Currency:** ${context.currency}
**Plan:** ${context.plan}

**This Month's Summary:**
- Total Expenses: ${context.currency} ${context.thisMonth.totalExpenses.toLocaleString()}
- Total Income: ${context.currency} ${context.thisMonth.totalIncome.toLocaleString()}
- Net Savings: ${context.currency} ${context.thisMonth.netSavings.toLocaleString()}
- Spending by Category: ${context.thisMonth.categoryBreakdown.map(c => `${c.category}: ${context.currency} ${c.amount.toLocaleString()}`).join(', ') || 'No data yet'}

**Last 3 Months Overview:**
- Average Monthly Expense: ${context.currency} ${context.threeMonths.avgMonthlyExpense.toLocaleString()}
- Average Monthly Income: ${context.currency} ${context.threeMonths.avgMonthlyIncome.toLocaleString()}
- Top Spending Categories: ${context.threeMonths.topCategories.map(c => `${c.category} (${context.currency} ${c.amount.toLocaleString()})`).join(', ') || 'No data yet'}

**Financial Goals:**
${context.goals.length > 0 ? context.goals.map(g => `- ${g.name}: ${context.currency} ${g.current.toLocaleString()} / ${context.currency} ${g.target.toLocaleString()} (${g.status})`).join('\n') : 'No goals set yet'}

**Guidelines:**
- Always reference the user's ACTUAL numbers when giving advice.
- Be encouraging but honest about overspending.
- Suggest actionable tips, not generic advice.
- If the user asks about something not in the data, say you can only analyze data they've logged in Spendly.
- Never share or repeat raw data dumps. Summarize naturally.
- Use emojis sparingly for a friendly tone.`;
  }

  /**
   * Smart fallback when Gemini is not configured or fails.
   * Analyzes the user's data and generates a helpful response without AI.
   */
  private generateFallbackResponse(userMessage: string, context: any): string {
    const msg = userMessage.toLowerCase();
    const { currency } = context;

    // Spending-related questions
    if (msg.includes('spend') || msg.includes('expense') || msg.includes('spent')) {
      if (context.thisMonth.totalExpenses === 0) {
        return `You haven't logged any expenses this month yet. Start tracking to get personalized insights! 📝`;
      }
      const topCat = context.thisMonth.categoryBreakdown[0];
      return `📊 **This Month's Spending Summary**\n\nYou've spent **${currency} ${context.thisMonth.totalExpenses.toLocaleString()}** this month across ${context.thisMonth.categoryBreakdown.length} categories.\n\nYour biggest spending category is **${topCat?.category}** at ${currency} ${topCat?.amount.toLocaleString()}.\n\n${context.thisMonth.netSavings >= 0 ? `✅ You're saving ${currency} ${context.thisMonth.netSavings.toLocaleString()} this month. Keep it up!` : `⚠️ You've overspent by ${currency} ${Math.abs(context.thisMonth.netSavings).toLocaleString()} this month. Try reducing non-essential expenses.`}`;
    }

    // Income-related questions
    if (msg.includes('income') || msg.includes('earn') || msg.includes('salary')) {
      return `💰 **Income Summary**\n\nThis month: **${currency} ${context.thisMonth.totalIncome.toLocaleString()}**\n3-month average: **${currency} ${context.threeMonths.avgMonthlyIncome.toLocaleString()}**/month\n\n${context.thisMonth.totalIncome > context.threeMonths.avgMonthlyIncome ? '📈 Your income this month is above your average!' : '📉 Your income is slightly below your 3-month average.'}`;
    }

    // Savings-related questions
    if (msg.includes('save') || msg.includes('saving')) {
      const rate = context.thisMonth.totalIncome > 0
        ? Math.round((context.thisMonth.netSavings / context.thisMonth.totalIncome) * 100)
        : 0;
      return `🏦 **Savings Analysis**\n\nThis month you're saving **${currency} ${context.thisMonth.netSavings.toLocaleString()}** (${rate}% savings rate).\n\n${rate >= 20 ? '🌟 Great job! Financial experts recommend saving at least 20%.' : rate > 0 ? '💡 Try to aim for a 20% savings rate. Look for areas to cut back.' : '🚨 You\'re spending more than you earn. Review your expenses urgently.'}`;
    }

    // Goal-related questions
    if (msg.includes('goal') || msg.includes('target')) {
      if (context.goals.length === 0) {
        return `🎯 You haven't set any financial goals yet! Head over to the **Goals** page to create one. Goals help you stay focused on what matters.`;
      }
      const goalSummary = context.goals.map(g => {
        const pct = Math.round((g.current / g.target) * 100);
        return `• **${g.name}**: ${currency} ${g.current.toLocaleString()} / ${currency} ${g.target.toLocaleString()} (${pct}% complete)`;
      }).join('\n');
      return `🎯 **Your Financial Goals**\n\n${goalSummary}`;
    }

    // Afford / Can I buy questions
    if (msg.includes('afford') || msg.includes('can i buy') || msg.includes('purchase')) {
      const monthlySavings = context.threeMonths.avgMonthlyIncome - context.threeMonths.avgMonthlyExpense;
      return `🤔 **Affordability Check**\n\nBased on your 3-month average, you save about **${currency} ${monthlySavings.toLocaleString()}/month**.\n\nAs a rule of thumb, any purchase under ${currency} ${Math.round(monthlySavings * 0.3).toLocaleString()} should be comfortable. For bigger purchases, consider saving for ${Math.ceil(50000 / monthlySavings)} months.\n\n💡 Pro tip: If a purchase is more than 10% of your monthly income, sleep on it for 24 hours!`;
    }

    // Default response
    return `👋 Hi ${context.userName}! I'm Spendly AI, your personal finance assistant.\n\nHere's a quick snapshot:\n- 💸 Spent this month: **${currency} ${context.thisMonth.totalExpenses.toLocaleString()}**\n- 💰 Earned this month: **${currency} ${context.thisMonth.totalIncome.toLocaleString()}**\n- 🏦 Net savings: **${currency} ${context.thisMonth.netSavings.toLocaleString()}**\n\nTry asking me things like:\n• "How much did I spend on food?"\n• "What's my savings rate?"\n• "Can I afford a ₹50,000 laptop?"\n• "How are my goals progressing?"`;
  }
}
