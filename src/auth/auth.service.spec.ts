import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { WalletsService } from '../wallets/wallets.service';

const mockUserRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockRefreshTokenRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
};

const mockWalletsService = {
  create: jest.fn().mockResolvedValue({ id: 'wallet-1' }),
};

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@test.com',
  password: '$2b$10$hashedpassword',
  role: UserRole.CLIENT,
  firstName: 'Jean',
  lastName: 'Dupont',
  isActive: true,
  ...overrides,
} as User);

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: WalletsService, useValue: mockWalletsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signup()', () => {
    const baseDto = { email: 'test@test.com', password: 'password123', firstName: 'Jean', lastName: 'Dupont' };

    it('rejette si l\'email est déjà utilisé', async () => {
      mockUserRepo.findOne.mockResolvedValue(makeUser());
      await expect(service.signup(baseDto)).rejects.toThrow(ConflictException);
    });

    it('crée un compte et génère les tokens', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const newUser = makeUser();
      mockUserRepo.create.mockReturnValue(newUser);
      mockUserRepo.save.mockResolvedValue(newUser);
      mockRefreshTokenRepo.create.mockReturnValue({});
      mockRefreshTokenRepo.save.mockResolvedValue({});

      const result = await service.signup({ ...baseDto, email: 'nouveau@test.com' });
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockWalletsService.create).toHaveBeenCalledWith({ userId: newUser.id });
    });

    it('hashé le mot de passe avant de le sauvegarder', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockImplementation((data) => data);
      mockUserRepo.save.mockImplementation((u) => Promise.resolve({ ...u, id: 'user-new' }));
      mockRefreshTokenRepo.create.mockReturnValue({});
      mockRefreshTokenRepo.save.mockResolvedValue({});

      await service.signup({ ...baseDto, email: 'autre@test.com', password: 'monmotdepasse' });

      const createCall = mockUserRepo.create.mock.calls[0][0];
      expect(createCall.password).not.toBe('monmotdepasse');
      expect(createCall.password).toMatch(/^\$2b\$/);
    });
  });

  describe('signin()', () => {
    const signinDto = { email: 'test@test.com', password: 'pass', firstName: 'Jean', lastName: 'Dupont' };

    it('rejette si l\'utilisateur n\'existe pas', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(
        service.signin({ ...signinDto, email: 'inconnu@test.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejette si le mot de passe est incorrect', async () => {
      mockUserRepo.findOne.mockResolvedValue(makeUser({ password: await bcrypt.hash('bonmotdepasse', 10) }));
      await expect(
        service.signin({ ...signinDto, password: 'mauvais' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('retourne les tokens avec des identifiants valides', async () => {
      const password = 'monmotdepasse';
      const hash = await bcrypt.hash(password, 10);
      mockUserRepo.findOne.mockResolvedValue(makeUser({ password: hash }));
      mockRefreshTokenRepo.create.mockReturnValue({});
      mockRefreshTokenRepo.save.mockResolvedValue({});

      const result = await service.signin({ ...signinDto, password });
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });
  });

  describe('logout()', () => {
    it('révoque tous les tokens de l\'utilisateur', async () => {
      mockRefreshTokenRepo.update.mockResolvedValue({ affected: 2 });
      await service.logout('user-1');
      expect(mockRefreshTokenRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1', isRevoked: false },
        { isRevoked: true },
      );
    });
  });

  describe('refreshToken()', () => {
    it('rejette si le refresh token est introuvable', async () => {
      mockRefreshTokenRepo.findOne.mockResolvedValue(null);
      await expect(
        service.refreshToken('user-1', 'test@test.com', 'invalid-token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejette si le refresh token est révoqué', async () => {
      mockRefreshTokenRepo.findOne.mockResolvedValue({
        id: 'rt-1',
        token: 'token',
        isRevoked: true,
        expiresAt: new Date(Date.now() + 86400000),
      });
      await expect(
        service.refreshToken('user-1', 'test@test.com', 'token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejette si le refresh token est expiré', async () => {
      mockRefreshTokenRepo.findOne.mockResolvedValue({
        id: 'rt-1',
        token: 'token',
        isRevoked: false,
        expiresAt: new Date(Date.now() - 1000), // expiré
      });
      await expect(
        service.refreshToken('user-1', 'test@test.com', 'token'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('génère de nouveaux tokens avec un refresh token valide', async () => {
      mockRefreshTokenRepo.findOne.mockResolvedValue({
        id: 'rt-1',
        token: 'valid-token',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
      });
      mockRefreshTokenRepo.update.mockResolvedValue({ affected: 1 });
      mockUserRepo.findOne.mockResolvedValue(makeUser());
      mockRefreshTokenRepo.create.mockReturnValue({});
      mockRefreshTokenRepo.save.mockResolvedValue({});

      const result = await service.refreshToken('user-1', 'test@test.com', 'valid-token');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });
  });
});
