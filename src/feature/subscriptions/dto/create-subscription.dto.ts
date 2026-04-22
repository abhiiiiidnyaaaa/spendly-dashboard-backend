import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'Netflix' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 15.99 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'Entertainment' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'monthly', enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @IsString()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({ example: '2023-12-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  nextBillingDate: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 'USD', required: false })
  @IsString()
  @IsOptional()
  currency?: string;
}
