import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { TicketsService } from './tickets.service';
import { BuyTicketDto, UseTicketDto } from './dto';
import { LinkTicketDto } from './dto/link-ticket.dto';

@ApiTags('tickets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @ApiOperation({ summary: 'Lister tous les tickets (admin)' })
  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  @ApiOperation({ summary: 'Récupérer un ticket par ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @ApiOperation({ summary: "Tickets d'un utilisateur" })
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

  @ApiOperation({ summary: "Historique des tickets d'un utilisateur" })
  @Get('user/:userId/history')
  getTicketHistory(@Param('userId') userId: string) {
    return this.ticketsService.getTicketHistory(userId);
  }

  @ApiOperation({ summary: 'Nombre de tickets pour une séance' })
  @Get('screening/:screeningId/count')
  getTicketCountByScreening(@Param('screeningId') screeningId: string) {
    return this.ticketsService.getTicketCountByScreening(screeningId);
  }

  @ApiOperation({ summary: 'Supprimer un ticket (admin)' })
  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketsService.delete(id);
  }

  @ApiOperation({ summary: 'Lier un super ticket à une séance' })
  @Post(':id/link-screening')
  linkSuperTicket(
    @Param('id') id: string,
    @Body() linkTicketDto: LinkTicketDto,
    @Req() req,
  ) {
    return this.ticketsService.linkSuperTicketToScreening(
      id,
      linkTicketDto.screeningId,
      req.user.userId,
    );
  }
}
