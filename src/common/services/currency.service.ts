import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  
  // Basic fallback rates relative to USD if API fails
  private fallbackRates: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    INR: 83.5,
    AUD: 1.5,
    CAD: 1.37,
    JPY: 155.0,
    CNY: 7.24,
  };

  /**
   * Converts an amount from one currency to another.
   * Fetches live rates, falls back to static rates if API fails.
   */
  async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (from === to) return amount;

    try {
      // Free public API without auth key for demonstration (rate limited)
      const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`);
      const rate = res.data?.rates?.[to];
      if (rate) {
        return amount * rate;
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch live exchange rate for ${from} to ${to}. Using fallback rates.`);
    }

    // Fallback logic
    const rateFromUSD = this.fallbackRates[from] || 1;
    const rateToUSD = this.fallbackRates[to] || 1;

    // Convert 'from' to USD, then USD to 'to'
    const amountInUSD = amount / rateFromUSD;
    const convertedAmount = amountInUSD * rateToUSD;
    
    return convertedAmount;
  }
}
