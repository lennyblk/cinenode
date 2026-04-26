import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Room } from './entities/room.entity';
import { Screening } from '../screenings/entities/screening.entity';

const mockQb = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
};

const mockRoomsRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockScreeningsRepo = {
  createQueryBuilder: jest.fn(() => ({ ...mockQb })),
};

const makeRoom = (overrides: Partial<Room> = {}): Room => ({
  id: 'room-1',
  name: 'Salle 1',
  description: 'Description',
  capacity: 20,
  isUnderMaintenance: false,
  accessibilityEnabled: false,
  ...overrides,
} as Room);

describe('RoomsService', () => {
  let service: RoomsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getRepositoryToken(Room), useValue: mockRoomsRepo },
        { provide: getRepositoryToken(Screening), useValue: mockScreeningsRepo },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  describe('findOne()', () => {
    it('lève NotFoundException si la salle n\'existe pas', async () => {
      mockRoomsRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('inexistant')).rejects.toThrow(NotFoundException);
    });

    it('retourne la salle existante', async () => {
      const room = makeRoom();
      mockRoomsRepo.findOne.mockResolvedValue(room);
      const result = await service.findOne('room-1');
      expect(result).toEqual(room);
    });
  });

  describe('create()', () => {
    const dto = { name: 'Salle A', description: 'desc', capacity: 20, type: 'standard' as any, images: [] };

    it('rejette si une salle avec ce nom existe déjà', async () => {
      mockRoomsRepo.findOne.mockResolvedValue(makeRoom({ name: 'Salle A' }));
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('crée une salle si le nom est unique', async () => {
      mockRoomsRepo.findOne.mockResolvedValue(null);
      const room = makeRoom({ name: 'Salle A' });
      mockRoomsRepo.create.mockReturnValue(room);
      mockRoomsRepo.save.mockResolvedValue(room);

      const result = await service.create(dto);
      expect(result).toEqual(room);
      expect(mockRoomsRepo.save).toHaveBeenCalled();
    });

    it('met accessibilityEnabled à false par défaut', async () => {
      mockRoomsRepo.findOne.mockResolvedValue(null);
      mockRoomsRepo.create.mockImplementation((data) => data);
      mockRoomsRepo.save.mockImplementation((r) => Promise.resolve(r));

      const result = await service.create(dto);
      expect(result.accessibilityEnabled).toBe(false);
    });

    it('met isUnderMaintenance à false à la création', async () => {
      mockRoomsRepo.findOne.mockResolvedValue(null);
      mockRoomsRepo.create.mockImplementation((data) => data);
      mockRoomsRepo.save.mockImplementation((r) => Promise.resolve(r));

      const result = await service.create(dto);
      expect(result.isUnderMaintenance).toBe(false);
    });
  });

  describe('update()', () => {
    it('lève NotFoundException si la salle à modifier n\'existe pas', async () => {
      mockRoomsRepo.findOne.mockResolvedValue(null);
      await expect(service.update('inexistant', { name: 'Nouveau nom' })).rejects.toThrow(NotFoundException);
    });

    it('rejette si le nouveau nom est déjà pris par une autre salle', async () => {
      // Premier findOne (vérif existence) retourne la salle actuelle
      mockRoomsRepo.findOne
        .mockResolvedValueOnce(makeRoom({ id: 'room-1', name: 'Salle 1' }))
        // Deuxième findOne (vérif nom unique) retourne une autre salle avec ce nom
        .mockResolvedValueOnce(makeRoom({ id: 'room-2', name: 'Salle A' }));

      await expect(service.update('room-1', { name: 'Salle A' })).rejects.toThrow(ConflictException);
    });

    it('met à jour la salle avec succès', async () => {
      const updatedRoom = makeRoom({ name: 'Salle Modifiée' });
      mockRoomsRepo.findOne
        .mockResolvedValueOnce(makeRoom())
        .mockResolvedValueOnce(null)       // pas de salle avec ce nom
        .mockResolvedValueOnce(updatedRoom); // findOne final
      mockRoomsRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('room-1', { name: 'Salle Modifiée' });
      expect(result.name).toBe('Salle Modifiée');
    });
  });

  describe('remove()', () => {
    it('lève NotFoundException si la salle à supprimer n\'existe pas', async () => {
      mockRoomsRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('inexistant')).rejects.toThrow(NotFoundException);
    });

    it('supprime la salle et retourne un message', async () => {
      mockRoomsRepo.findOne.mockResolvedValue(makeRoom());
      mockRoomsRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('room-1');
      expect(result).toHaveProperty('message');
    });
  });

  describe('toggleMaintenance()', () => {
    it('lève NotFoundException si la salle n\'existe pas', async () => {
      mockRoomsRepo.findOne.mockResolvedValue(null);
      await expect(service.toggleMaintenance('inexistant', true)).rejects.toThrow(NotFoundException);
    });

    it('passe la salle en maintenance', async () => {
      const updated = makeRoom({ isUnderMaintenance: true });
      mockRoomsRepo.findOne
        .mockResolvedValueOnce(makeRoom())
        .mockResolvedValueOnce(updated);
      mockRoomsRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.toggleMaintenance('room-1', true);
      expect(result.isUnderMaintenance).toBe(true);
    });

    it('retire la salle de maintenance', async () => {
      const updated = makeRoom({ isUnderMaintenance: false });
      mockRoomsRepo.findOne
        .mockResolvedValueOnce(makeRoom({ isUnderMaintenance: true }))
        .mockResolvedValueOnce(updated);
      mockRoomsRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.toggleMaintenance('room-1', false);
      expect(result.isUnderMaintenance).toBe(false);
    });
  });

  describe('getRoomSchedule()', () => {
    it('retourne une liste vide si la salle est en maintenance', async () => {
      mockRoomsRepo.findOne.mockResolvedValue(makeRoom({ isUnderMaintenance: true }));
      const result = await service.getRoomSchedule('room-1', '2026-05-04', '2026-05-11');
      expect(result.screenings).toEqual([]);
    });

    it('lève NotFoundException si la salle n\'existe pas', async () => {
      mockRoomsRepo.findOne.mockResolvedValue(null);
      await expect(service.getRoomSchedule('inexistant', '2026-05-04', '2026-05-11')).rejects.toThrow(NotFoundException);
    });
  });
});
