import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiChatSessionDocument = AiChatSession & Document;

@Schema({ _id: false })
export class ChatMessage {
  @Prop({ required: true, enum: ['user', 'model'] })
  role: string;

  @Prop({ required: true })
  parts: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

@Schema({ timestamps: true })
export class AiChatSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: string;

  @Prop({ type: [ChatMessage], default: [] })
  history: ChatMessage[];
}

export const AiChatSessionSchema = SchemaFactory.createForClass(AiChatSession);
