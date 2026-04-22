import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type GoalDocument = Goal & Document;

export enum GoalStatus {
  IN_PROGRESS = 'in_progress',
  ACHIEVED = 'achieved',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true })
export class Goal {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  targetAmount: number;

  @Prop({ default: 0, min: 0 })
  currentAmount: number;

  @Prop({ required: true })
  deadline: Date;

  @Prop({ required: true, default: 'INR' })
  currency: string;

  @Prop({ default: '#6366f1' }) // Default color for UI cards
  color: string;

  @Prop({ type: String, enum: Object.values(GoalStatus), default: GoalStatus.IN_PROGRESS })
  status: GoalStatus;
}

export const GoalSchema = SchemaFactory.createForClass(Goal);
