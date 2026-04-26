import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class DepositDto {
  @ApiProperty({ example: 50.00, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Recharge de bienvenue' })
  @IsString()
  @IsOptional()
  description?: string;
}
