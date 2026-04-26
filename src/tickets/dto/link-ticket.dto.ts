import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LinkTicketDto {
  @ApiProperty({ example: 'uuid-de-la-seance' })
  @IsUUID()
  screeningId: string;
}