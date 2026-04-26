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
import { AdminGuard } from '../auth/guards/admin.guard';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { ToggleMaintenanceDto } from './dto/toggle-maintenance.dto';

@ApiTags('rooms')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @ApiOperation({ summary: 'Lister toutes les salles' })
  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @ApiOperation({ summary: 'Récupérer une salle par ID' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.findOne(id);
  }

  @ApiOperation({ summary: "Programme d'une salle entre deux dates" })
  @ApiQuery({ name: 'from', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: true, example: '2026-12-31' })
  @Get(':id/schedule')
  getSchedule(
    @Param('id', ParseUUIDPipe) id: string,
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

    return this.roomsService.getRoomSchedule(id, from, to);
  }

  @ApiOperation({ summary: 'Créer une salle (admin)' })
  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @ApiOperation({ summary: 'Modifier une salle (admin)' })
  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @ApiOperation({ summary: 'Supprimer une salle (admin)' })
  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.remove(id);
  }

  @ApiOperation({ summary: 'Activer/désactiver la maintenance (admin)' })
  @UseGuards(AdminGuard)
  @Patch(':id/maintenance')
  toggleMaintenance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() toggleMaintenanceDto: ToggleMaintenanceDto,
  ) {
    return this.roomsService.toggleMaintenance(
      id,
      toggleMaintenanceDto.isUnderMaintenance,
    );
  }
}
