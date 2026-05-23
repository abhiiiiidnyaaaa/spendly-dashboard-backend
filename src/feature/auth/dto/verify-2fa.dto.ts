import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class Verify2faDto {
  @ApiProperty({ example: '123456', description: 'The 6-digit TOTP code from your authenticator app' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
