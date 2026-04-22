import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateIncomeDto {
  @ApiProperty({ example: 5000.00 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'Salary' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({ example: '2023-11-20T14:30:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'November Salary', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'INR', required: false, description: 'Currency code (USD, EUR, INR, GBP)' })
  @IsString()
  @IsOptional()
  currency?: string;
}
