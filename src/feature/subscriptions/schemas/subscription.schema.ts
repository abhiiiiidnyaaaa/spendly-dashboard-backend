import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true, trim: true })
  name: string; // e.g., 'Netflix', 'AWS'

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ required: true, enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  frequency: string;

  @Prop({ required: true })
  nextBillingDate: Date; // Important: The cron engine looks at this to know when to fire

  @Prop({ default: true })
  isActive: boolean; // Allow users to pause a subscription without deleting it

  @Prop({ default: 'INR', trim: true, uppercase: true })
  currency: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Index to quickly find active subscriptions whose billing date is due
SubscriptionSchema.index({ isActive: 1, nextBillingDate: 1 });
