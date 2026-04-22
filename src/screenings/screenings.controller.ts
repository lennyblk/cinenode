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
import { ScreeningsService } from './screenings.service';
import { CreateScreeningDto } from './dto/create-screening.dto';
import { UpdateScreeningDto } from './dto/update-screening.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('screenings')
export class ScreeningsController {
  constructor(private readonly screeningsService: ScreeningsService) {}

  @Get()
  findAll(@Query('from') from?: string, @Query('to') to?: string) {
    if ((from && Number.isNaN(new Date(from).getTime())) || (to && Number.isNaN(new Date(to).getTime()))) {
      throw new BadRequestException('from and to must be valid ISO dates');
    }

    return this.screeningsService.findAll(from, to);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.screeningsService.findOne(id);
  }

  @Post()
  create(@Body() createScreeningDto: CreateScreeningDto) {
    return this.screeningsService.create(createScreeningDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateScreeningDto: UpdateScreeningDto,
  ) {
    return this.screeningsService.update(id, updateScreeningDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.screeningsService.remove(id);
  }
}
