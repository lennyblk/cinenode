import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UseTicketDto {
  @ApiProperty({ example: 'uuid-de-la-seance' })
  @IsUUID()
  screeningId: string;
}
