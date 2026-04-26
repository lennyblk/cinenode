import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ScreeningsService } from './screenings.service';
import { CreateScreeningDto } from './dto/create-screening.dto';
import { UpdateScreeningDto } from './dto/update-screening.dto';

@ApiTags('screenings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('screenings')
export class ScreeningsController {
  constructor(private readonly screeningsService: ScreeningsService) {}

  @ApiOperation({ summary: 'Lister toutes les séances' })
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-12-31' })
  @Get()
  findAll(@Query('from') from?: string, @Query('to') to?: string) {
    if ((from && Number.isNaN(new Date(from).getTime())) || (to && Number.isNaN(new Date(to).getTime()))) {
      throw new BadRequestException('from and to must be valid ISO dates');
    }

    return this.screeningsService.findAll(from, to);
  }

  @ApiOperation({ summary: 'Récupérer une séance par ID' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.screeningsService.findOne(id);
  }

  @ApiOperation({ summary: 'Créer une séance' })
  @Post()
  create(@Body() createScreeningDto: CreateScreeningDto) {
    return this.screeningsService.create(createScreeningDto);
  }

  @ApiOperation({ summary: 'Modifier une séance' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateScreeningDto: UpdateScreeningDto,
  ) {
    return this.screeningsService.update(id, updateScreeningDto);
  }

  @ApiOperation({ summary: 'Supprimer une séance' })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.screeningsService.remove(id);
  }
}
