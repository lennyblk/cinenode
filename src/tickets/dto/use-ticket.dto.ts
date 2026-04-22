import { IsUUID } from 'class-validator';

export class UseTicketDto {
  @IsUUID()
  screeningId: string;
}