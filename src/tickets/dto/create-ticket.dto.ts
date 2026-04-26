import { IsEnum, IsUUID } from 'class-validator';
import { TicketType } from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsUUID()
  userId: string;
  
  @IsEnum(TicketType)
  type: TicketType;
  
  @IsUUID()
  screeningId: string;
}