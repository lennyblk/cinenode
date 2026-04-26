import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TicketType } from '../entities/ticket.entity';

export class BuyTicketDto {
  @ApiProperty({ enum: TicketType, example: TicketType.CLASSIC })
  @IsEnum(TicketType)
  type: TicketType;

  @ApiPropertyOptional({ example: 'uuid-de-la-seance' })
  @IsOptional()
  @IsUUID()
  screeningId?: string;
}