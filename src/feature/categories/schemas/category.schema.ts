import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ default: '#000000' })
  color: string;

  @Prop({ default: 'folder' })
  icon: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Index to ensure category names are unique per user
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });
