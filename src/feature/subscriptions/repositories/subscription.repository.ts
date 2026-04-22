import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument } from '../schemas/subscription.schema';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';

@Injectable()
export class SubscriptionRepository {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async create(userId: string, data: CreateSubscriptionDto): Promise<SubscriptionDocument> {
    const createdSub = new this.subscriptionModel({ ...data, userId });
    return createdSub.save();
  }

  async findAll(userId: string): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel.find({ userId }).sort({ nextBillingDate: 1 }).exec();
  }

  async findOne(userId: string, id: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOne({ _id: id, userId }).exec();
  }

  async update(userId: string, id: string, data: UpdateSubscriptionDto): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOneAndUpdate({ _id: id, userId }, { $set: data }, { new: true })
      .exec();
  }

  async remove(userId: string, id: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel.findOneAndDelete({ _id: id, userId }).exec();
  }

  // Used by the Cron Job engine to fetch all active subs that are due across ALL users
  async findDueSubscriptions(targetDate: Date): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel.find({
      isActive: true,
      nextBillingDate: { $lte: targetDate }
    }).exec();
  }

  // Update next billing date after processing
  async updateNextBillingDate(id: string, nextDate: Date): Promise<void> {
    await this.subscriptionModel.updateOne({ _id: id }, { $set: { nextBillingDate: nextDate } }).exec();
  }
}
