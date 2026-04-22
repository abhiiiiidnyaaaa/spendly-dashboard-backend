import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Income, IncomeDocument } from '../schemas/income.schema';
import { CreateIncomeDto } from '../dto/create-income.dto';
import { UpdateIncomeDto } from '../dto/update-income.dto';

@Injectable()
export class IncomeRepository {
  constructor(
    @InjectModel(Income.name) private incomeModel: Model<IncomeDocument>,
  ) {}

  async create(userId: string, data: CreateIncomeDto): Promise<IncomeDocument> {
    const createdIncome = new this.incomeModel({ ...data, userId });
    return createdIncome.save();
  }

  async findAll(userId: string): Promise<IncomeDocument[]> {
    return this.incomeModel.find({ userId }).sort({ date: -1 }).exec();
  }

  async findOne(userId: string, id: string): Promise<IncomeDocument | null> {
    return this.incomeModel.findOne({ _id: id, userId }).exec();
  }

  async update(
    userId: string,
    id: string,
    data: UpdateIncomeDto,
  ): Promise<IncomeDocument | null> {
    return this.incomeModel
      .findOneAndUpdate({ _id: id, userId }, { $set: data }, { new: true })
      .exec();
  }

  async remove(userId: string, id: string): Promise<IncomeDocument | null> {
    return this.incomeModel.findOneAndDelete({ _id: id, userId }).exec();
  }

  async calculateTotalIncome(userId: string): Promise<number> {
    const result = await this.incomeModel.aggregate([
      { $match: { userId: userId } }, // Would normally cast to ObjectId, but checking schema it's typed string here pending exact matching
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result.length > 0 ? result[0].total : 0;
  }
}
