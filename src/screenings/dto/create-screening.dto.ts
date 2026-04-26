import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class CreateScreeningDto {
  @ApiProperty({ example: 'uuid-de-la-salle' })
  @IsUUID()
  roomId: string;

  @ApiProperty({ example: 'uuid-du-film' })
  @IsUUID()
  movieId: string;

  @ApiProperty({ example: '2026-05-01T20:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ example: '2026-05-01T22:30:00.000Z' })
  @IsDateString()
  endsAt: string;
}
