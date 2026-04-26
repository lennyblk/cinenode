import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { Movie } from './entities/movie.entity';
import { Screening } from '../screenings/entities/screening.entity';

const mockQb = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
};

const mockMoviesRepo = {
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

const makeMovie = (overrides: Partial<Movie> = {}): Movie => ({
  id: 'movie-1',
  title: 'Test Movie',
  synopsis: 'Un film de test',
  durationMinutes: 90,
  isActive: true,
  ...overrides,
} as Movie);

describe('MoviesService', () => {
  let service: MoviesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: getRepositoryToken(Movie), useValue: mockMoviesRepo },
        { provide: getRepositoryToken(Screening), useValue: mockScreeningsRepo },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  describe('findOne()', () => {
    it('lève NotFoundException si le film n\'existe pas', async () => {
      mockMoviesRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('inexistant')).rejects.toThrow(NotFoundException);
    });

    it('retourne le film existant', async () => {
      const movie = makeMovie();
      mockMoviesRepo.findOne.mockResolvedValue(movie);
      const result = await service.findOne('movie-1');
      expect(result).toEqual(movie);
    });
  });

  describe('create()', () => {
    const dto = { title: 'Nouveau Film', synopsis: 'Synopsis', durationMinutes: 120 };

    it('rejette si un film avec ce titre existe déjà', async () => {
      mockMoviesRepo.findOne.mockResolvedValue(makeMovie({ title: 'Nouveau Film' }));
      await expect(service.create(dto as any)).rejects.toThrow(ConflictException);
    });

    it('crée un film si le titre est unique', async () => {
      mockMoviesRepo.findOne.mockResolvedValue(null);
      const movie = makeMovie({ title: 'Nouveau Film' });
      mockMoviesRepo.create.mockReturnValue(movie);
      mockMoviesRepo.save.mockResolvedValue(movie);

      const result = await service.create(dto as any);
      expect(result).toEqual(movie);
      expect(mockMoviesRepo.save).toHaveBeenCalled();
    });

    it('met isActive à true par défaut', async () => {
      mockMoviesRepo.findOne.mockResolvedValue(null);
      mockMoviesRepo.create.mockImplementation((data) => data);
      mockMoviesRepo.save.mockImplementation((m) => Promise.resolve(m));

      const result = await service.create(dto as any);
      expect(result.isActive).toBe(true);
    });
  });

  describe('update()', () => {
    it('lève NotFoundException si le film n\'existe pas', async () => {
      mockMoviesRepo.findOne.mockResolvedValue(null);
      await expect(service.update('inexistant', { title: 'Nouveau' })).rejects.toThrow(NotFoundException);
    });

    it('rejette si le nouveau titre est déjà pris par un autre film', async () => {
      mockMoviesRepo.findOne
        .mockResolvedValueOnce(makeMovie({ id: 'movie-1', title: 'Titre original' }))
        .mockResolvedValueOnce(makeMovie({ id: 'movie-2', title: 'Autre titre' }));

      await expect(service.update('movie-1', { title: 'Autre titre' })).rejects.toThrow(ConflictException);
    });

    it('met à jour un film avec succès', async () => {
      const updated = makeMovie({ title: 'Titre modifié' });
      mockMoviesRepo.findOne
        .mockResolvedValueOnce(makeMovie())
        .mockResolvedValueOnce(null)    // pas de doublon
        .mockResolvedValueOnce(updated);
      mockMoviesRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('movie-1', { title: 'Titre modifié' });
      expect(result.title).toBe('Titre modifié');
    });
  });

  describe('remove()', () => {
    it('lève NotFoundException si le film n\'existe pas', async () => {
      mockMoviesRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('inexistant')).rejects.toThrow(NotFoundException);
    });

    it('supprime le film et retourne un message', async () => {
      mockMoviesRepo.findOne.mockResolvedValue(makeMovie());
      mockMoviesRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('movie-1');
      expect(result).toHaveProperty('message');
    });
  });

  describe('getMovieSchedule()', () => {
    it('lève NotFoundException si le film n\'existe pas', async () => {
      mockMoviesRepo.findOne.mockResolvedValue(null);
      await expect(service.getMovieSchedule('inexistant', '2026-05-04', '2026-05-11')).rejects.toThrow(NotFoundException);
    });

    it('retourne les séances d\'un film sur une période', async () => {
      const screenings = [
        { id: 'sc-1', startsAt: new Date('2026-05-05T10:00:00Z'), movie: {}, room: {} },
      ];
      mockMoviesRepo.findOne.mockResolvedValue(makeMovie());
      mockScreeningsRepo.createQueryBuilder.mockReturnValue({
        ...mockQb,
        getMany: jest.fn().mockResolvedValue(screenings),
      });

      const result = await service.getMovieSchedule('movie-1', '2026-05-04', '2026-05-11');
      expect(result.screenings).toHaveLength(1);
      expect(result.movieId).toBe('movie-1');
    });
  });
});
