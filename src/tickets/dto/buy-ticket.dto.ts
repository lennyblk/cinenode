import { IsEnum, IsUUID } from 'class-validator';
import { TicketType } from '../entities/ticket.entity';

export class BuyTicketDto {
  @IsEnum(TicketType)
  type: TicketType;
  
  @IsUUID()
  screeningId: string;
}