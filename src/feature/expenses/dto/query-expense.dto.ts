import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryExpenseDto {
  @ApiProperty({ example: 1, required: false, type: Number })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 20, required: false, type: Number })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ example: 'Food & Dining', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: '2023-11-01', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ example: '2023-11-30', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;
}
