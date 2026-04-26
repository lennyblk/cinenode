import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketType } from './entities/ticket.entity';
import { Screening } from '../screenings/entities/screening.entity';
import { WalletsService } from '../wallets/wallets.service';
import { BuyTicketDto, UseTicketDto } from './dto';

const TICKET_PRICES = {
  [TicketType.CLASSIC]: 10,
  [TicketType.SUPER]: 80,
};

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    @InjectRepository(Screening)
    private screeningsRepository: Repository<Screening>,
    private walletsService: WalletsService,
  ) {}

async create(userId: string, buyTicketDto: BuyTicketDto) {
  const wallet = await this.walletsService.findByUserId(userId);
  const ticketPrice = TICKET_PRICES[buyTicketDto.type];

  if (parseFloat(wallet.balance.toString()) < ticketPrice) {
    throw new BadRequestException(
      `Insufficient balance. You need ${ticketPrice}€ but have ${wallet.balance}€`,
    );
  }

  if (buyTicketDto.type === TicketType.CLASSIC) {
    if (!buyTicketDto.screeningId) {
      throw new BadRequestException('screeningId is required for classic tickets');
    }
    
    const screening = await this.screeningsRepository.findOne({
      where: { id: buyTicketDto.screeningId },
      relations: ['room'],
    });
    if (!screening) {
      throw new NotFoundException(
        `Screening with id ${buyTicketDto.screeningId} not found`,
      );
    }

    if (screening.isCancelled) {
      throw new BadRequestException('This screening has been cancelled');
    }

    const ticketsSold = await this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoin('ticket.screenings', 'screening')
      .where('screening.id = :screeningId', { screeningId: buyTicketDto.screeningId })
      .getCount();

    if (ticketsSold >= screening.room.capacity) {
      throw new BadRequestException('No seats available for this screening');
    }

    const ticket = this.ticketsRepository.create({
      userId,
      type: buyTicketDto.type,
      screenings: [screening],
    });

    const savedTicket = await this.ticketsRepository.save(ticket);
    await this.walletsService.deductBalance(
      wallet.id,
      ticketPrice,
      `Purchase of ${buyTicketDto.type} ticket for screening ${screening.id}`,
    );
    return savedTicket;
  } 

  else {
    const ticket = this.ticketsRepository.create({
      userId,
      type: buyTicketDto.type,
      screenings: [],
    });

    const savedTicket = await this.ticketsRepository.save(ticket);
    await this.walletsService.deductBalance(
      wallet.id,
      ticketPrice,
      `Purchase of ${buyTicketDto.type} ticket`,
    );
    return savedTicket;
  }
}

async linkSuperTicketToScreening(ticketId: string, screeningId: string, userId: string) {
  const ticket = await this.findOne(ticketId);
  
  if (ticket.userId !== userId) {
    throw new ForbiddenException('You can only link your own tickets');
  }
  
  if (ticket.type !== TicketType.SUPER) {
    throw new BadRequestException('Only super tickets can be linked to screenings');
  }

  const screening = await this.screeningsRepository.findOne({
    where: { id: screeningId },
    relations: ['room'],
  });
  if (!screening) {
    throw new NotFoundException(`Screening with id ${screeningId} not found`);
  }

  if (screening.isCancelled) {
    throw new BadRequestException('This screening has been cancelled');
  }

  const isAlreadyLinked = ticket.screenings.some(s => s.id === screeningId);
  if (isAlreadyLinked) {
    throw new BadRequestException('This ticket is already linked to this screening');
  }

  const ticketsSold = await this.ticketsRepository
    .createQueryBuilder('ticket')
    .leftJoin('ticket.screenings', 'screening')
    .where('screening.id = :screeningId', { screeningId })
    .getCount();

  if (ticketsSold >= screening.room.capacity) {
    throw new BadRequestException('No seats available for this screening');
  }

  ticket.screenings.push(screening);
  return this.ticketsRepository.save(ticket);
}

  async findAll() {
    const tickets = await this.ticketsRepository.find({
      relations: ['user', 'screenings'],
    });
    if (tickets.length === 0) {
      throw new NotFoundException('No tickets found');
    }
    return tickets;
  }

  async findOne(id: string) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['user', 'screenings'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} not found`);
    }
    return ticket;
  }

  async findByUserId(userId: string) {
    const tickets = await this.ticketsRepository.find({
      where: { userId },
      relations: ['screenings'],
      order: { createdAt: 'DESC' },
    });
    if (tickets.length === 0) {
      throw new NotFoundException(`No tickets found for user ${userId}`);
    }
    return tickets;
  }

  async useTicket(ticketId: string, useTicketDto: UseTicketDto) {
    const ticket = await this.findOne(ticketId);

    const screening = await this.screeningsRepository.findOne({
      where: { id: useTicketDto.screeningId },
      relations: ['tickets'],
    });
    if (!screening) {
      throw new NotFoundException(
        `Screening with id ${useTicketDto.screeningId} not found`,
      );
    }

    const isScreeningLinkedToTicket = ticket.screenings.some(
      (s) => s.id === useTicketDto.screeningId,
    );
    if (!isScreeningLinkedToTicket) {
      throw new BadRequestException(
        'This ticket is not valid for this screening',
      );
    }

    if (ticket.type === TicketType.CLASSIC && ticket.usedCount > 0) {
      throw new BadRequestException('This classic ticket has already been used');
    }

    if (ticket.type === TicketType.SUPER && ticket.usedCount >= 10) {
      throw new BadRequestException(
        'This super ticket has reached its usage limit (10 screenings)',
      );
    }

    ticket.usedCount += 1;

    if (
      ticket.type === TicketType.CLASSIC ||
      ticket.usedCount === 10
    ) {
      ticket.isUsed = true;
      ticket.usedAt = new Date();
    }

    return this.ticketsRepository.save(ticket);
  }

  async getTicketHistory(userId: string) {
    const tickets = await this.ticketsRepository.find({
      where: { userId },
      relations: ['screenings'],
      order: { createdAt: 'DESC' },
    });

    if (tickets.length === 0) {
      throw new NotFoundException(`No tickets found for user ${userId}`);
    }

    return tickets.map((ticket) => ({
      id: ticket.id,
      type: ticket.type,
      isUsed: ticket.isUsed,
      usedCount: ticket.usedCount,
      createdAt: ticket.createdAt,
      usedAt: ticket.usedAt,
      screenings: ticket.screenings.map((screening) => ({
        id: screening.id,
        startsAt: screening.startsAt,
        endsAt: screening.endsAt,
      })),
    }));
  }

  async getTicketCountByScreening(screeningId: string) {
    const count = await this.ticketsRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.screenings', 'screening')
      .where('screening.id = :screeningId', { screeningId })
      .getCount();

    return {
      screeningId,
      totalTickets: count,
    };
  }

  async delete(id: string) {
    const ticketDeleted = await this.ticketsRepository.delete(id);
    if (ticketDeleted.affected === 0) {
      return { message: `Ticket with id ${id} not found` };
    }
    return { message: `Ticket with id ${id} has been deleted` };
  }
}
