import { Module, Global } from '@nestjs/common';
import { CurrencyService } from './services/currency.service';

@Global()
@Module({
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CommonModule {}
