import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type IncomeDocument = Income & Document;

@Schema({ timestamps: true })
export class Income {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, trim: true })
  source: string; // e.g., Salary, Freelance, Investment

  @Prop({ required: true, default: Date.now })
  date: Date;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ default: 'INR', trim: true, uppercase: true })
  currency: string;

  @Prop({ required: false })
  baseAmount?: number;
}

export const IncomeSchema = SchemaFactory.createForClass(Income);

// Indexing for faster query logic
IncomeSchema.index({ userId: 1, date: -1 });
