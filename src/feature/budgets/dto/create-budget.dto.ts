import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty({ example: 'Food & Dining' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 500, description: 'Maximum spending limit for this category' })
  @IsNumber()
  @Min(1)
  limitAmount: number;

  @ApiProperty({ example: 4, description: 'Month (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2026, description: 'Year' })
  @IsInt()
  @Min(2020)
  year: number;

  @ApiProperty({ example: 90, required: false, description: 'Alert when spent exceeds this % of limit' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  alertThreshold?: number;
}
