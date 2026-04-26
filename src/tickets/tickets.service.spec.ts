import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { Ticket, TicketType } from './entities/ticket.entity';
import { Screening } from '../screenings/entities/screening.entity';
import { WalletsService } from '../wallets/wallets.service';

const mockQb = {
  leftJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(0),
  getMany: jest.fn().mockResolvedValue([]),
};

const mockTicketsRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({ ...mockQb })),
};

const mockScreeningsRepo = {
  findOne: jest.fn(),
};

const mockWalletsService = {
  findByUserId: jest.fn(),
  deductBalance: jest.fn(),
};

const makeWallet = (balance: number) => ({ id: 'wallet-1', balance } as any);
const makeRoom = (capacity = 20) => ({ id: 'room-1', capacity } as any);
const makeScreening = (overrides: any = {}) => ({
  id: 'screening-1',
  isCancelled: false,
  room: makeRoom(),
  tickets: [],
  ...overrides,
} as any);

const makeTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: 'ticket-1',
  userId: 'user-1',
  type: TicketType.CLASSIC,
  isUsed: false,
  usedCount: 0,
  screenings: [],
  createdAt: new Date(),
  ...overrides,
} as unknown as Ticket);

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getRepositoryToken(Ticket), useValue: mockTicketsRepo },
        { provide: getRepositoryToken(Screening), useValue: mockScreeningsRepo },
        { provide: WalletsService, useValue: mockWalletsService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  // ── Achat billet classique ─────────────────────────────────────────────────

  describe('create() - billet classique', () => {
    beforeEach(() => {
      mockScreeningsRepo.findOne.mockResolvedValue(makeScreening());
      mockTicketsRepo.createQueryBuilder.mockReturnValue({ ...mockQb, getCount: jest.fn().mockResolvedValue(0) });
      mockTicketsRepo.create.mockReturnValue({});
      mockTicketsRepo.save.mockResolvedValue({ id: 'ticket-new' });
      mockWalletsService.deductBalance.mockResolvedValue({});
    });

    it('rejette si le solde est insuffisant (10€ requis)', async () => {
      mockWalletsService.findByUserId.mockResolvedValue(makeWallet(5));
      await expect(
        service.create('user-1', { type: TicketType.CLASSIC, screeningId: 'screening-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si screeningId est absent pour un billet classique', async () => {
      mockWalletsService.findByUserId.mockResolvedValue(makeWallet(50));
      await expect(
        service.create('user-1', { type: TicketType.CLASSIC }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si la séance est annulée', async () => {
      mockWalletsService.findByUserId.mockResolvedValue(makeWallet(50));
      mockScreeningsRepo.findOne.mockResolvedValue(makeScreening({ isCancelled: true }));
      await expect(
        service.create('user-1', { type: TicketType.CLASSIC, screeningId: 'screening-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si la séance est complète', async () => {
      mockWalletsService.findByUserId.mockResolvedValue(makeWallet(50));
      mockScreeningsRepo.findOne.mockResolvedValue(makeScreening({ room: makeRoom(5) }));
      mockTicketsRepo.createQueryBuilder.mockReturnValue({ ...mockQb, getCount: jest.fn().mockResolvedValue(5) });
      await expect(
        service.create('user-1', { type: TicketType.CLASSIC, screeningId: 'screening-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si la séance est introuvable', async () => {
      mockWalletsService.findByUserId.mockResolvedValue(makeWallet(50));
      mockScreeningsRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create('user-1', { type: TicketType.CLASSIC, screeningId: 'inexistant' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('crée un billet classique valide', async () => {
      mockWalletsService.findByUserId.mockResolvedValue(makeWallet(50));
      const result = await service.create('user-1', { type: TicketType.CLASSIC, screeningId: 'screening-1' });
      expect(mockTicketsRepo.save).toHaveBeenCalled();
      expect(mockWalletsService.deductBalance).toHaveBeenCalledWith('wallet-1', 10, expect.any(String));
      expect(result).toHaveProperty('id');
    });
  });

  // ── Achat super billet ─────────────────────────────────────────────────────

  describe('create() - super billet', () => {
    it('rejette si le solde est insuffisant (80€ requis)', async () => {
      mockWalletsService.findByUserId.mockResolvedValue(makeWallet(50));
      await expect(
        service.create('user-1', { type: TicketType.SUPER }),
      ).rejects.toThrow(BadRequestException);
    });

    it('crée un super billet sans séance initiale', async () => {
      mockWalletsService.findByUserId.mockResolvedValue(makeWallet(100));
      mockTicketsRepo.create.mockReturnValue({});
      mockTicketsRepo.save.mockResolvedValue({ id: 'super-ticket' });
      mockWalletsService.deductBalance.mockResolvedValue({});

      const result = await service.create('user-1', { type: TicketType.SUPER });
      expect(mockWalletsService.deductBalance).toHaveBeenCalledWith('wallet-1', 80, expect.any(String));
      expect(result).toHaveProperty('id');
    });
  });

  // ── Utilisation d'un billet ────────────────────────────────────────────────

  describe('useTicket()', () => {
    it('rejette si la séance n\'est pas liée au billet', async () => {
      mockTicketsRepo.findOne.mockResolvedValue(
        makeTicket({ screenings: [{ id: 'autre-seance' }] as any }),
      );
      mockScreeningsRepo.findOne.mockResolvedValue(makeScreening());
      await expect(
        service.useTicket('ticket-1', { screeningId: 'screening-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si un billet classique a déjà été utilisé', async () => {
      mockTicketsRepo.findOne.mockResolvedValue(
        makeTicket({ type: TicketType.CLASSIC, usedCount: 1, screenings: [{ id: 'screening-1' }] as any }),
      );
      mockScreeningsRepo.findOne.mockResolvedValue(makeScreening());
      await expect(
        service.useTicket('ticket-1', { screeningId: 'screening-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si un super billet a atteint la limite de 10 utilisations', async () => {
      mockTicketsRepo.findOne.mockResolvedValue(
        makeTicket({ type: TicketType.SUPER, usedCount: 10, screenings: [{ id: 'screening-1' }] as any }),
      );
      mockScreeningsRepo.findOne.mockResolvedValue(makeScreening());
      await expect(
        service.useTicket('ticket-1', { screeningId: 'screening-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('valide un billet classique à sa première utilisation', async () => {
      const ticket = makeTicket({ screenings: [{ id: 'screening-1' }] as any });
      mockTicketsRepo.findOne.mockResolvedValue(ticket);
      mockScreeningsRepo.findOne.mockResolvedValue(makeScreening());
      mockTicketsRepo.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.useTicket('ticket-1', { screeningId: 'screening-1' });
      expect(result.usedCount).toBe(1);
      expect(result.isUsed).toBe(true);
    });

    it('valide un super billet (9ème utilisation, pas encore épuisé)', async () => {
      const ticket = makeTicket({
        type: TicketType.SUPER,
        usedCount: 8,
        screenings: [{ id: 'screening-1' }] as any,
      });
      mockTicketsRepo.findOne.mockResolvedValue(ticket);
      mockScreeningsRepo.findOne.mockResolvedValue(makeScreening());
      mockTicketsRepo.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.useTicket('ticket-1', { screeningId: 'screening-1' });
      expect(result.usedCount).toBe(9);
      expect(result.isUsed).toBe(false);
    });

    it('marque le super billet comme épuisé à la 10ème utilisation', async () => {
      const ticket = makeTicket({
        type: TicketType.SUPER,
        usedCount: 9,
        screenings: [{ id: 'screening-1' }] as any,
      });
      mockTicketsRepo.findOne.mockResolvedValue(ticket);
      mockScreeningsRepo.findOne.mockResolvedValue(makeScreening());
      mockTicketsRepo.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.useTicket('ticket-1', { screeningId: 'screening-1' });
      expect(result.usedCount).toBe(10);
      expect(result.isUsed).toBe(true);
    });
  });

  // ── Liaison super billet ───────────────────────────────────────────────────

  describe('linkSuperTicketToScreening()', () => {
    it('rejette si le billet n\'appartient pas à l\'utilisateur', async () => {
      mockTicketsRepo.findOne.mockResolvedValue(
        makeTicket({ userId: 'autre-user', type: TicketType.SUPER, screenings: [] }),
      );
      await expect(
        service.linkSuperTicketToScreening('ticket-1', 'screening-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejette si le billet est de type classique', async () => {
      mockTicketsRepo.findOne.mockResolvedValue(
        makeTicket({ type: TicketType.CLASSIC, screenings: [] }),
      );
      await expect(
        service.linkSuperTicketToScreening('ticket-1', 'screening-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si la séance est annulée', async () => {
      mockTicketsRepo.findOne.mockResolvedValue(
        makeTicket({ type: TicketType.SUPER, screenings: [] }),
      );
      mockScreeningsRepo.findOne.mockResolvedValue(makeScreening({ isCancelled: true }));
      await expect(
        service.linkSuperTicketToScreening('ticket-1', 'screening-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si le billet est déjà lié à cette séance', async () => {
      mockTicketsRepo.findOne.mockResolvedValue(
        makeTicket({ type: TicketType.SUPER, screenings: [{ id: 'screening-1' }] as any }),
      );
      mockScreeningsRepo.findOne.mockResolvedValue(makeScreening());
      await expect(
        service.linkSuperTicketToScreening('ticket-1', 'screening-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si la séance est complète', async () => {
      mockTicketsRepo.findOne.mockResolvedValue(
        makeTicket({ type: TicketType.SUPER, screenings: [] }),
      );
      mockScreeningsRepo.findOne.mockResolvedValue(makeScreening({ room: makeRoom(3) }));
      mockTicketsRepo.createQueryBuilder.mockReturnValue({ ...mockQb, getCount: jest.fn().mockResolvedValue(3) });
      await expect(
        service.linkSuperTicketToScreening('ticket-1', 'screening-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lie le super billet à une séance valide', async () => {
      const ticket = makeTicket({ type: TicketType.SUPER, screenings: [] });
      mockTicketsRepo.findOne.mockResolvedValue(ticket);
      mockScreeningsRepo.findOne.mockResolvedValue(makeScreening());
      mockTicketsRepo.createQueryBuilder.mockReturnValue({ ...mockQb, getCount: jest.fn().mockResolvedValue(0) });
      mockTicketsRepo.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.linkSuperTicketToScreening('ticket-1', 'screening-1', 'user-1');
      expect(result.screenings).toHaveLength(1);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('lève NotFoundException si le billet est introuvable', async () => {
      mockTicketsRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('inexistant')).rejects.toThrow(NotFoundException);
    });
  });
});
