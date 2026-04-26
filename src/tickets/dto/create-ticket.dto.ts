import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { TicketType } from '../entities/ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ example: 'uuid-de-l-utilisateur' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: TicketType, example: TicketType.CLASSIC })
  @IsEnum(TicketType)
  type: TicketType;

  @ApiProperty({ example: 'uuid-de-la-seance' })
  @IsUUID()
  screeningId: string;
}
