import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BudgetDocument = Budget & Document;

@Schema({ timestamps: true })
export class Budget {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ required: true, min: 0 })
  limitAmount: number;

  @Prop({ required: true })
  month: number; // 1-12

  @Prop({ required: true })
  year: number;

  @Prop({ default: 0 })
  spentAmount: number;

  @Prop({ default: 90, min: 1, max: 100 })
  alertThreshold: number; // Alert when spent exceeds this % of limit
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);

// Ensure one budget per category per month per user
BudgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });
