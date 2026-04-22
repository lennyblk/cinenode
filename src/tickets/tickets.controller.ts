import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { BuyTicketDto, UseTicketDto } from './dto';

@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.ticketsService.findByUserId(userId);
  }

  @Post('user/:userId/buy')
  buyTicket(
    @Param('userId') userId: string,
    @Body() buyTicketDto: BuyTicketDto,
  ) {
    return this.ticketsService.create(userId, buyTicketDto);
  }

  @Post(':id/use')
  useTicket(@Param('id') id: string, @Body() useTicketDto: UseTicketDto) {
    return this.ticketsService.useTicket(id, useTicketDto);
  }

  @Get('user/:userId/history')
  getTicketHistory(@Param('userId') userId: string) {
    return this.ticketsService.getTicketHistory(userId);
  }

  @Get('screening/:screeningId/count')
  getTicketCountByScreening(@Param('screeningId') screeningId: string) {
    return this.ticketsService.getTicketCountByScreening(screeningId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.delete(id);
  }
}
