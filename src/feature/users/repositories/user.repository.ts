/**
 * UserRepository
 *
 * Handles all database operations for the User collection.
 * Abstracts Mongoose model interactions from the business logic layer.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  // ========== Create ==========

  async create(data: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  // ========== Find Methods ==========

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  /**
   * Find by ID but exclude the password field
   * Used for profile retrieval and public-facing responses
   */
  async findByIdWithoutPassword(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    }).exec();
  }

  async findByRazorpayCustomerId(customerId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ razorpayCustomerId: customerId }).exec();
  }

  // ========== Update ==========

  async update(
    id: string,
    data: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-password')
      .exec();
  }

  // ========== Validation Queries ==========

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const query: any = { email: email.toLowerCase() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const count = await this.userModel.countDocuments(query).exec();
    return count > 0;
  }
}
