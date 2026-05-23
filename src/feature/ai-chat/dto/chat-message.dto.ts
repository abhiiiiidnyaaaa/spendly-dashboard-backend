import { IsString, IsNotEmpty, MaxLength, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatHistoryDto {
  @IsString()
  @IsNotEmpty()
  role: 'user' | 'model';

  @IsString()
  @IsNotEmpty()
  parts: string;
}

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryDto)
  history?: ChatHistoryDto[];
}
