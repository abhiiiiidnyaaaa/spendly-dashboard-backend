import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CreateExpenseUseCase } from './create-expense.usecase';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
const csv = require('csv-parser');

@Injectable()
export class ImportExpensesUseCase {
  private readonly logger = new Logger(ImportExpensesUseCase.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async execute(userId: string, file: Express.Multer.File): Promise<{ imported: number }> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      let importedCount = 0;

      fs.createReadStream(file.path)
        .pipe(csv({
          mapHeaders: ({ header }: { header: string }) => header.trim().toLowerCase().replace(/^\uFEFF/, '')
        }))
        .on('data', (data: any) => results.push(data))
        .on('end', async () => {
          try {
            for (const row of results) {
              const amount = parseFloat(row.amount || row.value || row.cost);
              if (isNaN(amount)) continue;

              const rawDescription = row.description || row.note || row.merchant || '';
              let finalCategory = row.category || row.type || '';
              let finalDescription = rawDescription;

              // AI Categorization if no category exists and AI is enabled
              if (!finalCategory && rawDescription && this.genAI) {
                try {
                  const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
                  const prompt = `You are a financial transaction categorizer. Given this messy bank statement description: "${rawDescription}", output a JSON object with two fields: "category" (e.g. Food, Transport, Utilities, Entertainment, Shopping, Health) and "merchant" (a cleaned up, human-readable name of the merchant). Output ONLY the raw JSON object, no markdown.`;
                  const result = await model.generateContent(prompt);
                  const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                  const parsed = JSON.parse(text);
                  
                  if (parsed.category) finalCategory = parsed.category;
                  if (parsed.merchant) finalDescription = parsed.merchant;
                } catch (e) {
                  this.logger.warn(`AI Categorization failed for row: ${rawDescription}`);
                  finalCategory = 'Other';
                }
              }

              if (!finalCategory) finalCategory = 'Other';

              await this.createExpenseUseCase.execute(userId, {
                amount,
                category: finalCategory,
                date: row.date || new Date().toISOString(),
                description: finalDescription,
                currency: row.currency || 'INR',
              });
              importedCount++;
            }
            // Clean up the uploaded CSV file
            fs.unlinkSync(file.path);
            resolve({ imported: importedCount });
          } catch (err) {
            this.logger.error('Error during CSV import', err);
            reject(new BadRequestException('Failed to process CSV file'));
          }
        })
        .on('error', (error: any) => {
          this.logger.error('Failed to parse CSV stream', error);
          reject(new BadRequestException('Invalid CSV format'));
        });
    });
  }
}
