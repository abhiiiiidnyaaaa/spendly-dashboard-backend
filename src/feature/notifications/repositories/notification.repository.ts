import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectModel(Notification.name) private readonly model: Model<NotificationDocument>,
  ) {}

  async create(data: Partial<Notification>): Promise<NotificationDocument> {
    return new this.model(data).save();
  }

  async findByUser(userId: string, limit = 20): Promise<NotificationDocument[]> {
    return this.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async countUnread(userId: string): Promise<number> {
    return this.model.countDocuments({ userId, isRead: false }).exec();
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationDocument | null> {
    return this.model.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true },
    ).exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.model.updateMany({ userId, isRead: false }, { isRead: true }).exec();
  }
}
