import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Groceries' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '#ff0000', required: false })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 'shopping_cart', required: false })
  @IsString()
  @IsOptional()
  icon?: string;
}
