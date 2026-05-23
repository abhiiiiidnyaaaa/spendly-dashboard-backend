import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: null })
  avatar: string;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ default: 'INR', trim: true, uppercase: true })
  baseCurrency: string;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  @Prop({ default: false })
  isTwoFactorEnabled: boolean;

  @Prop()
  twoFactorSecret?: string;

  // ========== Billing / Razorpay ==========
  @Prop({ default: 'FREE', enum: ['FREE', 'PRO'] })
  planTier: string;

  @Prop()
  razorpayCustomerId?: string;

  @Prop()
  razorpaySubscriptionId?: string;

  @Prop()
  razorpaySubscriptionStatus?: string;

  // ========== Gamification ==========
  @Prop({ type: [String], default: [] })
  badges: string[]; // e.g., 'FIRST_EXPENSE', 'BUDGET_MASTER', 'GOAL_CRUSHER'

  @Prop({ default: 0 })
  currentStreak: number; // Days in a row logging an expense

  @Prop()
  lastLoginDate?: Date; // To help calculate streaks
}

export const UserSchema = SchemaFactory.createForClass(User);
