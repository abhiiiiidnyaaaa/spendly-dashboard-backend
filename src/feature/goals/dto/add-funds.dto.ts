import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddFundsDto {
  @ApiProperty({ example: 150, description: 'Amount to add towards the goal' })
  @IsNumber()
  @IsPositive()
  amount: number;
}
