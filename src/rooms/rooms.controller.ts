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
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { ToggleMaintenanceDto } from './dto/toggle-maintenance.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.findOne(id);
  }

  @Post()
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.remove(id);
  }

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
}
