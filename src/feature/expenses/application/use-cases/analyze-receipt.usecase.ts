import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as tesseract from 'tesseract.js';
import * as fs from 'fs';

@Injectable()
export class AnalyzeReceiptUseCase {
  private readonly logger = new Logger(AnalyzeReceiptUseCase.name);

  async execute(file: Express.Multer.File): Promise<{ text: string; amount: number | null; date: string | null; merchant: string | null }> {
    let receiptText = '';
    let amount: number | null = null;
    let date: string | null = null;
    let merchant: string | null = null;

    try {
      this.logger.log(`Starting OCR analysis on ${file.path}`);
      const { data: { text } } = await tesseract.recognize(file.path, 'eng', {
        logger: (m) => this.logger.debug(m),
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
      
      // Simple smart parsing using regex
      // Match amount: look for $ or ₹ or just decimal numbers at the end of lines, etc.
      // Usually "Total: $12.34" or "Amount 12.34"
      const amountMatch = text.match(/(?:total|amount|sum)[\s:]*[$₹£€]?\s*(\d+(?:\.\d{2})?)/i);
      if (amountMatch && amountMatch[1]) {
        amount = parseFloat(amountMatch[1]);
      } else {
        // Fallback: just find the largest decimal number
        const decimals = text.match(/\d+\.\d{2}/g);
        if (decimals && decimals.length > 0) {
          const numbers = decimals.map(Number);
          amount = Math.max(...numbers);
        }
      }

      // Match date: look for MM/DD/YYYY or YYYY-MM-DD
      const dateMatch = text.match(/(\d{1,4}[-/]\d{1,2}[-/]\d{1,4})/);
      if (dateMatch && dateMatch[1]) {
        const parsedDate = new Date(dateMatch[1]);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString();
        }
      }

      // Match merchant: assume it's the first non-empty line with mostly letters
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      for (const line of lines) {
        // If line has a good amount of alphabet characters and no obvious receipt keywords
        if (/[A-Za-z]{3,}/.test(line) && !/total|amount|cash|change|tax/i.test(line)) {
          merchant = line;
          break;
        }
      }

    } catch (err) {
      this.logger.error(`OCR analysis failed on ${file.path}`, err);
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Failed to process the image for OCR.');
    } finally {
      // Clean up the temporary file used for analysis
      try {
         if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch (e) {}
    }

    return { text: receiptText, amount, date, merchant };
  }
}
