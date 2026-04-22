import { IsString, IsNotEmpty, IsNumber, IsPositive, IsDateString, IsOptional, IsHexColor, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGoalDto {
  @ApiProperty({ example: 'Vacation to Hawaii', description: 'Name of the savings goal' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 5000, description: 'Target amount to save' })
  @IsNumber()
  @IsPositive()
  targetAmount: number;

  @ApiPropertyOptional({ example: 500, description: 'Initial savings amount (optional)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @ApiProperty({ example: '2026-12-31T00:00:00.000Z', description: 'Target deadline date' })
  @IsDateString()
  @IsNotEmpty()
  deadline: string;

  @ApiPropertyOptional({ example: '#10b981', description: 'Hex color for the goal card UI' })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;
}
