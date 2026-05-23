import { Injectable, NotFoundException } from '@nestjs/common';
import { IncomeRepository } from '../../repositories/income.repository';
import { CreateIncomeDto } from '../../dto/create-income.dto';
import { UpdateIncomeDto } from '../../dto/update-income.dto';
import { IncomeDocument } from '../../schemas/income.schema';
import { CurrencyService } from '../../../../common/services/currency.service';
import { UserService } from '../../../users/application/services/user.service';

@Injectable()
export class IncomeService {
  constructor(
    private readonly incomeRepository: IncomeRepository,
    private readonly currencyService: CurrencyService,
    private readonly userService: UserService,
  ) {}

  async create(userId: string, createIncomeDto: CreateIncomeDto): Promise<IncomeDocument> {
    const user = await this.userService.findById(userId);
    const baseCurrency = user?.baseCurrency || 'INR';
    const currency = createIncomeDto.currency?.toUpperCase() || 'INR';
    const baseAmount = await this.currencyService.convert(createIncomeDto.amount, currency, baseCurrency);

    return this.incomeRepository.create(userId, {
      ...createIncomeDto,
      currency,
      baseAmount,
    } as any);
  }

  async findAll(userId: string): Promise<IncomeDocument[]> {
    return this.incomeRepository.findAll(userId);
  }

  async findOne(userId: string, id: string): Promise<IncomeDocument> {
    const income = await this.incomeRepository.findOne(userId, id);
    if (!income) {
      throw new NotFoundException(`Income #${id} not found`);
    }
    return income;
  }

  async update(userId: string, id: string, updateIncomeDto: UpdateIncomeDto): Promise<IncomeDocument> {
    const updatedIncome = await this.incomeRepository.update(userId, id, updateIncomeDto);
    if (!updatedIncome) {
      throw new NotFoundException(`Income #${id} not found`);
    }
    return updatedIncome;
  }

  async remove(userId: string, id: string): Promise<IncomeDocument> {
    const deletedIncome = await this.incomeRepository.remove(userId, id);
    if (!deletedIncome) {
      throw new NotFoundException(`Income #${id} not found`);
    }
    return deletedIncome;
  }
}
