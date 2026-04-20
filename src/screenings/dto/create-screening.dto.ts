import { IsDateString, IsUUID } from 'class-validator';

export class CreateScreeningDto {
  @IsUUID()
  roomId: string;

  @IsUUID()
  movieId: string;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;
}
