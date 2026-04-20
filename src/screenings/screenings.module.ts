import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScreeningsController } from './screenings.controller';
import { ScreeningsService } from './screenings.service';
import { Screening } from './entities/screening.entity';
import { Room } from '../rooms/entities/room.entity';
import { Movie } from '../movies/entities/movie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Screening, Room, Movie])],
  controllers: [ScreeningsController],
  providers: [ScreeningsService],
  exports: [ScreeningsService],
})
export class ScreeningsModule {}
