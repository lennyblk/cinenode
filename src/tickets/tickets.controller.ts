import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { BuyTicketDto, UseTicketDto } from './dto';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @ApiOperation({ summary: 'Lister tous les tickets' })
  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  @ApiOperation({ summary: 'Récupérer un ticket par ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @ApiOperation({ summary: 'Tickets d\'un utilisateur' })
  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.ticketsService.findByUserId(userId);
  }

  @ApiOperation({ summary: 'Acheter un ticket' })
  @Post('user/:userId/buy')
  buyTicket(
    @Param('userId') userId: string,
    @Body() buyTicketDto: BuyTicketDto,
  ) {
    return this.ticketsService.create(userId, buyTicketDto);
  }

  @ApiOperation({ summary: 'Utiliser un ticket' })
  @Post(':id/use')
  useTicket(@Param('id') id: string, @Body() useTicketDto: UseTicketDto) {
    return this.ticketsService.useTicket(id, useTicketDto);
  }

  @ApiOperation({ summary: 'Historique des tickets d\'un utilisateur' })
  @Get('user/:userId/history')
  getTicketHistory(@Param('userId') userId: string) {
    return this.ticketsService.getTicketHistory(userId);
  }

  @ApiOperation({ summary: 'Nombre de tickets pour une séance' })
  @Get('screening/:screeningId/count')
  getTicketCountByScreening(@Param('screeningId') screeningId: string) {
    return this.ticketsService.getTicketCountByScreening(screeningId);
  }

  @ApiOperation({ summary: 'Supprimer un ticket' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.delete(id);
  }
}
