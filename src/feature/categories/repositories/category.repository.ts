import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(data: Partial<Category>): Promise<CategoryDocument> {
    const defaultCategoriesExists = await this.categoryModel.findOne({ userId: data.userId });
    
    const category = new this.categoryModel(data);
    return category.save();
  }

  async createMany(data: Partial<Category>[]): Promise<CategoryDocument[]> {
    const docs = await this.categoryModel.insertMany(data);
    return docs as unknown as CategoryDocument[];
  }

  async findAll(userId: string): Promise<CategoryDocument[]> {
    return this.categoryModel.find({ userId }).sort({ name: 1 }).exec();
  }

  async findById(
    categoryId: string,
    userId: string,
  ): Promise<CategoryDocument | null> {
    return this.categoryModel.findOne({ _id: categoryId, userId }).exec();
  }

  async update(
    categoryId: string,
    userId: string,
    data: Partial<Category>,
  ): Promise<CategoryDocument | null> {
    return this.categoryModel
      .findOneAndUpdate({ _id: categoryId, userId }, data, { new: true })
      .exec();
  }

  async delete(categoryId: string, userId: string): Promise<boolean> {
    const result = await this.categoryModel
      .deleteOne({ _id: categoryId, userId })
      .exec();
    return result.deletedCount === 1;
  }

  async existsByName(name: string, userId: string, excludeId?: string): Promise<boolean> {
    const query: any = { name: new RegExp(`^${name}$`, 'i'), userId };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const count = await this.categoryModel.countDocuments(query).exec();
    return count > 0;
  }
}
