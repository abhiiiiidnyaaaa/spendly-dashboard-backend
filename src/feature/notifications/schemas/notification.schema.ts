import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  BUDGET_ALERT = 'budget_alert',
  SUBSCRIPTION_RENEWAL = 'subscription_renewal',
  GOAL_MILESTONE = 'goal_milestone',
  GOAL_ACHIEVED = 'goal_achieved',
  SYSTEM = 'system',
  NEW_BADGE = 'new_badge',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, enum: Object.values(NotificationType), required: true })
  type: NotificationType;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>; // Extra data like goalId, budgetCategory, etc.
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
