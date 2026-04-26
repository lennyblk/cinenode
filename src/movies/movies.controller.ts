import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@ApiTags('movies')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @ApiOperation({ summary: 'Lister tous les films' })
  @Get()
  findAll() {
    return this.moviesService.findAll();
  }

  @ApiOperation({ summary: 'Récupérer un film par ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moviesService.findOne(id);
  }

  @ApiOperation({ summary: "Programme d'un film entre deux dates" })
  @ApiQuery({ name: 'from', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: true, example: '2026-12-31' })
  @Get(':id/schedule')
  getSchedule(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (
      !from ||
      !to ||
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(toDate.getTime()) ||
      fromDate > toDate
    ) {
      throw new BadRequestException(
        'from and to query params must be valid ISO dates with from <= to',
      );
    }

    return this.moviesService.getMovieSchedule(id, from, to);
  }

  @ApiOperation({ summary: 'Créer un film (admin)' })
  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createMovieDto: CreateMovieDto) {
    return this.moviesService.create(createMovieDto);
  }

  @ApiOperation({ summary: 'Modifier un film (admin)' })
  @UseGuards(AdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMovieDto: UpdateMovieDto) {
    return this.moviesService.update(id, updateMovieDto);
  }

  @ApiOperation({ summary: 'Supprimer un film (admin)' })
  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.moviesService.remove(id);
  }
}
