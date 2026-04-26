import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ScreeningsService } from './screenings.service';
import { Screening } from './entities/screening.entity';
import { Room } from '../rooms/entities/room.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
  getOne: jest.fn().mockResolvedValue(null),
  getCount: jest.fn().mockResolvedValue(0),
  getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
};

const mockScreeningsRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({ ...mockQueryBuilder })),
};

const mockRoomsRepo = {
  findOne: jest.fn(),
};

const mockMoviesRepo = {
  findOne: jest.fn(),
};

const mockTicketsRepo = {
  createQueryBuilder: jest.fn(() => ({ ...mockQueryBuilder })),
};

// Crée des dates en heure locale pour que getHours() soit cohérent avec la validation
const localIso = (year: number, month: number, day: number, h: number, m = 0) =>
  new Date(year, month - 1, day, h, m, 0, 0).toISOString();

// Lundi 05 mai 2026 (mois 5 = index 4)
const MONDAY_9H_ISO = localIso(2026, 5, 4, 9, 0);
const MONDAY_11H_ISO = localIso(2026, 5, 4, 11, 0);
const SATURDAY_10H_ISO = localIso(2026, 5, 2, 10, 0);

const makeRoom = (overrides: Partial<Room> = {}): Room =>
  ({ id: 'room-1', name: 'Salle 1', capacity: 20, isUnderMaintenance: false, ...overrides } as Room);

const makeMovie = (overrides: Partial<Movie> = {}): Movie =>
  ({ id: 'movie-1', title: 'Test Movie', durationMinutes: 90, isActive: true, ...overrides } as Movie);

describe('ScreeningsService', () => {
  let service: ScreeningsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScreeningsService,
        { provide: getRepositoryToken(Screening), useValue: mockScreeningsRepo },
        { provide: getRepositoryToken(Room), useValue: mockRoomsRepo },
        { provide: getRepositoryToken(Movie), useValue: mockMoviesRepo },
        { provide: getRepositoryToken(Ticket), useValue: mockTicketsRepo },
      ],
    }).compile();

    service = module.get<ScreeningsService>(ScreeningsService);
  });

  describe('create()', () => {
    const validDto = {
      roomId: 'room-1',
      movieId: 'movie-1',
      startsAt: MONDAY_9H_ISO,
      endsAt: MONDAY_11H_ISO,
    };

    beforeEach(() => {
      mockRoomsRepo.findOne.mockResolvedValue(makeRoom());
      mockMoviesRepo.findOne.mockResolvedValue(makeMovie());
      mockScreeningsRepo.createQueryBuilder.mockReturnValue({ ...mockQueryBuilder, getMany: jest.fn().mockResolvedValue([]) });
      mockScreeningsRepo.create.mockReturnValue({});
      mockScreeningsRepo.save.mockResolvedValue({ id: 'screening-1' });
    });

    it('crée une séance valide', async () => {
      const result = await service.create(validDto);
      expect(mockScreeningsRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('rejette une salle en maintenance', async () => {
      mockRoomsRepo.findOne.mockResolvedValue(makeRoom({ isUnderMaintenance: true }));
      await expect(service.create(validDto)).rejects.toThrow(BadRequestException);
    });

    it('rejette une salle inexistante', async () => {
      mockRoomsRepo.findOne.mockResolvedValue(null);
      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
    });

    it('rejette un film inactif', async () => {
      mockMoviesRepo.findOne.mockResolvedValue(makeMovie({ isActive: false }));
      await expect(service.create(validDto)).rejects.toThrow(BadRequestException);
    });

    it('rejette un film inexistant', async () => {
      mockMoviesRepo.findOne.mockResolvedValue(null);
      await expect(service.create(validDto)).rejects.toThrow(NotFoundException);
    });

    it('rejette si endsAt est avant startsAt', async () => {
      await expect(
        service.create({ ...validDto, startsAt: localIso(2026, 5, 4, 11), endsAt: localIso(2026, 5, 4, 9) }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si endsAt === startsAt', async () => {
      const same = localIso(2026, 5, 4, 10);
      await expect(
        service.create({ ...validDto, startsAt: same, endsAt: same }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette une séance le week-end (samedi)', async () => {
      await expect(
        service.create({ ...validDto, startsAt: SATURDAY_10H_ISO, endsAt: localIso(2026, 5, 2, 12) }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette une séance commençant avant 9h', async () => {
      await expect(
        service.create({ ...validDto, startsAt: localIso(2026, 5, 4, 7), endsAt: localIso(2026, 5, 4, 8, 30) }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette une séance se terminant après 20h', async () => {
      await expect(
        service.create({ ...validDto, startsAt: localIso(2026, 5, 4, 18), endsAt: localIso(2026, 5, 4, 21) }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si la durée est inférieure à durée_film + 30 min', async () => {
      // Film de 90 min → minimum 120 min. On donne 60 min.
      await expect(
        service.create({ ...validDto, startsAt: localIso(2026, 5, 4, 9), endsAt: localIso(2026, 5, 4, 10) }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si chevauchement dans la même salle', async () => {
      const overlapping = { ...mockQueryBuilder, getMany: jest.fn().mockResolvedValue([{ id: 'other' }]) };
      mockScreeningsRepo.createQueryBuilder.mockReturnValue(overlapping);
      await expect(service.create(validDto)).rejects.toThrow(ConflictException);
    });

    it('rejette si le même film est diffusé en même temps dans une autre salle', async () => {
      // Premier appel (room overlap) = pas de conflit, second (movie overlap) = conflit
      const noOverlap = { ...mockQueryBuilder, getMany: jest.fn().mockResolvedValue([]) };
      const withOverlap = { ...mockQueryBuilder, getMany: jest.fn().mockResolvedValue([{ id: 'other' }]) };
      mockScreeningsRepo.createQueryBuilder
        .mockReturnValueOnce(noOverlap)
        .mockReturnValueOnce(withOverlap);
      await expect(service.create(validDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne()', () => {
    it('lève NotFoundException si la séance n\'existe pas', async () => {
      mockScreeningsRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('inexistant')).rejects.toThrow(NotFoundException);
    });

    it('retourne la séance avec ticketsSold', async () => {
      const room = makeRoom();
      const screening = { id: 'sc-1', roomId: 'room-1', room, startsAt: new Date(MONDAY_9H_ISO), endsAt: new Date(MONDAY_11H_ISO) };
      mockScreeningsRepo.findOne.mockResolvedValue(screening);
      const qb = { ...mockQueryBuilder, getCount: jest.fn().mockResolvedValue(5) };
      mockTicketsRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOne('sc-1');
      expect(result.ticketsSold).toBe(5);
      expect(result.availableSeats).toBe(room.capacity - 5);
    });
  });

  describe('update()', () => {
    it('lève NotFoundException si la séance à modifier n\'existe pas', async () => {
      mockScreeningsRepo.findOne.mockResolvedValue(null);
      await expect(service.update('inexistant', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('lève NotFoundException si la séance à supprimer n\'existe pas', async () => {
      mockScreeningsRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('inexistant')).rejects.toThrow(NotFoundException);
    });

    it('supprime une séance existante', async () => {
      const room = makeRoom();
      mockScreeningsRepo.findOne.mockResolvedValue({ id: 'sc-1', room });
      mockTicketsRepo.createQueryBuilder.mockReturnValue({ ...mockQueryBuilder, getCount: jest.fn().mockResolvedValue(0) });
      mockScreeningsRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('sc-1');
      expect(result).toHaveProperty('message');
    });
  });
});
