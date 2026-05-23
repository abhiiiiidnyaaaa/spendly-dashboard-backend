import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import { ExpenseRepository } from '../../repositories/expense.repository';
import * as tesseract from 'tesseract.js';
import { ExpenseDocument } from '../../schemas/expense.schema';

@Injectable()
export class UploadReceiptUseCase {
  private readonly logger = new Logger(UploadReceiptUseCase.name);

  constructor(private readonly repository: ExpenseRepository) {}

  async execute(
    expenseId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<ExpenseDocument> {
    const expense = await this.repository.findById(expenseId, userId);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    // Save the relative URL so the frontend can display it
    const receiptUrl = `/uploads/${file.filename}`;
    let receiptText = '';

    try {
      this.logger.log(`Starting OCR on ${file.path}`);
      // Run basic OCR
      const { data: { text } } = await tesseract.recognize(file.path, 'eng', {
        logger: m => this.logger.debug(m),
      });
      receiptText = text;
      
      if (receiptText.trim().length < 5) {
        throw new BadRequestException('No readable text found. Please upload a clear picture of a receipt.');
      }

      const lowercaseText = receiptText.toLowerCase();
      const receiptKeywords = ['total', 'amount', 'tax', 'receipt', 'invoice', 'cash', 'card', 'balance', 'paid', 'due', 'date', 'pay', 'store', 'shop', 'merchant', 'qty', 'item'];
      const containsKeywords = receiptKeywords.some(keyword => lowercaseText.includes(keyword));
      const containsNumbers = /\d/.test(lowercaseText);

      if (!containsKeywords || !containsNumbers) {
        throw new BadRequestException('Image does not appear to be a valid receipt. Please upload a clear picture of a receipt or invoice.');
      }

      this.logger.log(`OCR completed successfully for ${expenseId}`);
    } catch (err) {
      this.logger.error(`OCR failed on ${file.path}`, err);
      // Clean up the invalid file
      try {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch (e) {}
      
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Failed to process the image for OCR.');
    }

    // Update the expense
    const updatedExpense = await this.repository.update(expenseId, userId, {
      receiptUrl,
      receiptText,
    });

    if (!updatedExpense) {
      throw new NotFoundException('Expense not found during update');
    }

    return updatedExpense;
  }
}
