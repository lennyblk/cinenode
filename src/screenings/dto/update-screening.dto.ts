import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class UpdateScreeningDto {
  @ApiPropertyOptional({ example: 'uuid-de-la-salle' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({ example: 'uuid-du-film' })
  @IsOptional()
  @IsUUID()
  movieId?: string;

  @ApiPropertyOptional({ example: '2026-05-01T20:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ example: '2026-05-01T22:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
