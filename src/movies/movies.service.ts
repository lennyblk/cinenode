import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Screening } from '../screenings/entities/screening.entity';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly moviesRepository: Repository<Movie>,
    @InjectRepository(Screening)
    private readonly screeningsRepository: Repository<Screening>,
  ) {}

  findAll() {
    return this.moviesRepository.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: string) {
    const movie = await this.moviesRepository.findOne({ where: { id } });
    if (!movie) {
      throw new NotFoundException(`Movie with id ${id} not found`);
    }
    return movie;
  }

  async create(createMovieDto: CreateMovieDto) {
    const existingMovie = await this.moviesRepository.findOne({
      where: { title: createMovieDto.title },
    });
    if (existingMovie) {
      throw new ConflictException(
        `Movie with title ${createMovieDto.title} already exists`,
      );
    }

    const movie = this.moviesRepository.create({
      ...createMovieDto,
      isActive: createMovieDto.isActive ?? true,
    });

    return this.moviesRepository.save(movie);
  }

  async update(id: string, updateMovieDto: UpdateMovieDto) {
    const existingMovie = await this.findOne(id);

    if (updateMovieDto.title && updateMovieDto.title !== existingMovie.title) {
      const movieWithSameTitle = await this.moviesRepository.findOne({
        where: { title: updateMovieDto.title },
      });

      if (movieWithSameTitle && movieWithSameTitle.id !== id) {
        throw new ConflictException(
          `Movie with title ${updateMovieDto.title} already exists`,
        );
      }
    }

    await this.moviesRepository.update(id, updateMovieDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const movie = await this.findOne(id);
    await this.moviesRepository.delete(id);

    return {
      message: `Movie ${movie.title} deleted`,
    };
  }

  async getMovieSchedule(id: string, from: string, to: string) {
    await this.findOne(id);

    const screenings = await this.screeningsRepository
      .createQueryBuilder('screening')
      .leftJoinAndSelect('screening.movie', 'movie')
      .leftJoinAndSelect('screening.room', 'room')
      .where('screening.movieId = :id', { id })
      .andWhere('screening.isCancelled = :isCancelled', { isCancelled: false })
      .andWhere('screening.startsAt <= :to', { to })
      .andWhere('screening.endsAt >= :from', { from })
      .andWhere('room.isUnderMaintenance = :isUnderMaintenance', {
        isUnderMaintenance: false,
      })
      .orderBy('screening.startsAt', 'ASC')
      .getMany();

    return {
      movieId: id,
      from,
      to,
      screenings,
    };
  }
}
