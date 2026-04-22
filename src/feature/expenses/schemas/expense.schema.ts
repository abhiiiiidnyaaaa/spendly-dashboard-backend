import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ExpenseDocument = Expense & Document;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ required: true, default: Date.now })
  date: Date;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ default: 'INR', trim: true, uppercase: true })
  currency: string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

// Indexing for faster query logic (finding a user's expenses sorted by date)
ExpenseSchema.index({ userId: 1, date: -1 });
