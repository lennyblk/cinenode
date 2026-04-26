import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { Screening } from './entities/screening.entity';
import { CreateScreeningDto } from './dto/create-screening.dto';
import { UpdateScreeningDto } from './dto/update-screening.dto';
import { Room } from '../rooms/entities/room.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

@Injectable()
export class ScreeningsService {
  constructor(
    @InjectRepository(Screening)
    private readonly screeningsRepository: Repository<Screening>,
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
    @InjectRepository(Movie)
    private readonly moviesRepository: Repository<Movie>,
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
  ) {}

  findAll(from?: string, to?: string) {
  const query = this.screeningsRepository
    .createQueryBuilder('screening')
    .leftJoinAndSelect('screening.room', 'room')
    .leftJoinAndSelect('screening.movie', 'movie')
    .leftJoin('screening.tickets', 'ticket')
    .addSelect('COUNT(DISTINCT ticket.id)', 'ticketsSold')
    .groupBy('screening.id')
    .addGroupBy('room.id')
    .addGroupBy('movie.id')
    .orderBy('screening.startsAt', 'ASC');

  if (from) {
    query.andWhere('screening.startsAt >= :from', { from });
  }

  if (to) {
    query.andWhere('screening.endsAt <= :to', { to });
  }

  return query.getRawAndEntities().then(result => {
    return result.entities.map((screening, index) => ({
      ...screening,
      ticketsSold: parseInt(result.raw[index].ticketsSold) || 0,
      availableSeats: screening.room.capacity - (parseInt(result.raw[index].ticketsSold) || 0),
    }));
  });
}

  async findOne(id: string) {
    const screening = await this.screeningsRepository.findOne({
      where: { id },
      relations: ['room', 'movie'],
    });

    if (!screening) {
      throw new NotFoundException(`Screening with id ${id} not found`);
    }

    const ticketsSold = await this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoin('ticket.screenings', 'screening')
      .where('screening.id = :screeningId', { screeningId: id })
      .getCount();

    return {
      ...screening,
      ticketsSold,
      availableSeats: screening.room.capacity - ticketsSold,
    };
  }


  async create(createScreeningDto: CreateScreeningDto) {
    const room = await this.getActiveRoomOrThrow(createScreeningDto.roomId);
    const movie = await this.getActiveMovieOrThrow(createScreeningDto.movieId);

    const startsAt = new Date(createScreeningDto.startsAt);
    const endsAt = new Date(createScreeningDto.endsAt);

    this.validateDateOrder(startsAt, endsAt);
    this.validateOpeningHours(startsAt, endsAt);
    this.validateMinimumDuration(startsAt, endsAt, movie.durationMinutes);

    await this.ensureNoOverlapInRoom(startsAt, endsAt, room.id);
    await this.ensureNoOverlapForSameMovie(startsAt, endsAt, movie.id);

    const screening = this.screeningsRepository.create({
      ...createScreeningDto,
      startsAt,
      endsAt,
      isCancelled: false,
    });

    return this.screeningsRepository.save(screening);
  }

  async update(id: string, updateScreeningDto: UpdateScreeningDto) {
    const existingScreening = await this.findOne(id);

    const roomId = updateScreeningDto.roomId ?? existingScreening.roomId;
    const movieId = updateScreeningDto.movieId ?? existingScreening.movieId;

    const room = await this.getActiveRoomOrThrow(roomId);
    const movie = await this.getActiveMovieOrThrow(movieId);

    const startsAt = updateScreeningDto.startsAt
      ? new Date(updateScreeningDto.startsAt)
      : existingScreening.startsAt;
    const endsAt = updateScreeningDto.endsAt
      ? new Date(updateScreeningDto.endsAt)
      : existingScreening.endsAt;

    this.validateDateOrder(startsAt, endsAt);
    this.validateOpeningHours(startsAt, endsAt);
    this.validateMinimumDuration(startsAt, endsAt, movie.durationMinutes);

    await this.ensureNoOverlapInRoom(startsAt, endsAt, room.id, id);
    await this.ensureNoOverlapForSameMovie(startsAt, endsAt, movie.id, id);

    await this.screeningsRepository.update(id, {
      roomId,
      movieId,
      startsAt,
      endsAt,
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.screeningsRepository.delete(id);
    return { message: `Screening with id ${id} deleted` };
  }

  async findRoomSchedule(roomId: string, from: string, to: string) {
    return this.screeningsRepository.find({
      where: {
        roomId,
        startsAt: Not(new Date(to)),
      },
      relations: ['movie', 'room'],
      order: { startsAt: 'ASC' },
    });
  }

  async findMovieSchedule(movieId: string, from: string, to: string) {
    return this.screeningsRepository.find({
      where: {
        movieId,
        startsAt: Not(new Date(to)),
      },
      relations: ['movie', 'room'],
      order: { startsAt: 'ASC' },
    });
  }

  private async getActiveRoomOrThrow(roomId: string) {
    const room = await this.roomsRepository.findOne({ where: { id: roomId } });

    if (!room) {
      throw new NotFoundException(`Room with id ${roomId} not found`);
    }

    if (room.isUnderMaintenance) {
      throw new BadRequestException(
        `Room ${room.name} is under maintenance and cannot host screenings`,
      );
    }

    return room;
  }

  private async getActiveMovieOrThrow(movieId: string) {
    const movie = await this.moviesRepository.findOne({
      where: { id: movieId },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with id ${movieId} not found`);
    }

    if (!movie.isActive) {
      throw new BadRequestException(
        `Movie ${movie.title} is inactive and cannot be scheduled`,
      );
    }

    return movie;
  }

  private validateDateOrder(startsAt: Date, endsAt: Date) {
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('startsAt and endsAt must be valid ISO dates');
    }

    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be strictly after startsAt');
    }
  }

  private validateOpeningHours(startsAt: Date, endsAt: Date) {
    if (!this.isWeekday(startsAt) || !this.isWeekday(endsAt)) {
      throw new BadRequestException('Screenings must be scheduled from Monday to Friday');
    }

    if (!this.isWithinOpeningHours(startsAt) || !this.isWithinOpeningHours(endsAt)) {
      throw new BadRequestException('Screenings must start and end between 09:00 and 20:00');
    }
  }

  private validateMinimumDuration(
    startsAt: Date,
    endsAt: Date,
    movieDurationMinutes: number,
  ) {
    const durationMs = endsAt.getTime() - startsAt.getTime();
    const minimumMs = (movieDurationMinutes + 30) * 60 * 1000;

    if (durationMs < minimumMs) {
      throw new BadRequestException(
        `Screening duration must be at least movie duration + 30 minutes (${movieDurationMinutes + 30} min)`,
      );
    }
  }

  private async ensureNoOverlapInRoom(
    startsAt: Date,
    endsAt: Date,
    roomId: string,
    excludeScreeningId?: string,
  ) {
    const overlapping = await this.findOverlaps(
      { roomId, isCancelled: false },
      startsAt,
      endsAt,
      excludeScreeningId,
    );

    if (overlapping.length > 0) {
      throw new ConflictException(
        `Room already has a screening overlapping this time window`,
      );
    }
  }

  private async ensureNoOverlapForSameMovie(
    startsAt: Date,
    endsAt: Date,
    movieId: string,
    excludeScreeningId?: string,
  ) {
    const overlapping = await this.findOverlaps(
      { movieId, isCancelled: false },
      startsAt,
      endsAt,
      excludeScreeningId,
    );

    if (overlapping.length > 0) {
      throw new ConflictException(
        `This movie is already scheduled in another overlapping screening`,
      );
    }
  }

  private findOverlaps(
    where: FindOptionsWhere<Screening>,
    startsAt: Date,
    endsAt: Date,
    excludeScreeningId?: string,
  ) {
    const query = this.screeningsRepository
      .createQueryBuilder('screening')
      .where(where)
      .andWhere('screening.startsAt < :endsAt', { endsAt })
      .andWhere('screening.endsAt > :startsAt', { startsAt });

    if (excludeScreeningId) {
      query.andWhere('screening.id != :excludeScreeningId', {
        excludeScreeningId,
      });
    }

    return query.getMany();
  }

  private isWeekday(date: Date) {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  }

  private isWithinOpeningHours(date: Date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    return totalMinutes >= 9 * 60 && totalMinutes <= 20 * 60;
  }
}
