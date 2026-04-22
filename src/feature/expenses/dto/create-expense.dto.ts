import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 45.50 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'Food & Dining' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: '2023-11-20T14:30:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'Lunch at Cafe', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'INR', required: false, description: 'Currency code (USD, EUR, INR, GBP)' })
  @IsString()
  @IsOptional()
  currency?: string;
}
