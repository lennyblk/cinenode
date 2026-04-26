import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class WithdrawDto {
  @ApiProperty({ example: 20.00, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Retrait' })
  @IsString()
  @IsOptional()
  description?: string;
}
