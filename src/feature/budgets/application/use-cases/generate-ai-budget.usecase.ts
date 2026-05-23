import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CreateBudgetUseCase } from './create-budget.usecase';
import { BudgetRepository } from '../../repositories/budget.repository';

@Injectable()
export class GenerateAiBudgetUseCase {
  private readonly logger = new Logger(GenerateAiBudgetUseCase.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private readonly createBudgetUseCase: CreateBudgetUseCase,
    private readonly repository: BudgetRepository,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async execute(userId: string, month: number, year: number, totalIncome: number = 5000): Promise<any[]> {
    if (!this.genAI) {
      throw new BadRequestException('AI is not configured. Please add GEMINI_API_KEY.');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      const prompt = `You are an expert financial planner. The user earns an estimated ${totalIncome} this month. 
Create a balanced monthly budget for them following the 50/30/20 rule (50% Needs, 30% Wants, 20% Savings/Debt).
Distribute the amounts into specific realistic categories: "Food & Dining", "Housing", "Transport", "Utilities", "Entertainment", "Shopping", "Savings", "Health & Wellness".
Output ONLY a raw JSON array of objects. Each object must have exactly two fields: "category" (string) and "limitAmount" (number). Do not use markdown tags, just the raw JSON array.`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const budgetsToCreate: Array<{ category: string; limitAmount: number }> = JSON.parse(text);

      const createdBudgets: any[] = [];
      for (const item of budgetsToCreate) {
        const existing = await this.repository.findByCategoryAndMonth(userId, item.category, month, year);
        if (!existing) {
          const budget = await this.createBudgetUseCase.execute(userId, {
            category: item.category,
            limitAmount: item.limitAmount,
            alertThreshold: 80,
            month,
            year
          });
          createdBudgets.push(budget);
        }
      }

      return createdBudgets;
    } catch (e) {
      this.logger.error('Failed to generate AI budget', e);
      throw new BadRequestException('Failed to generate AI Budget');
    }
  }
}
