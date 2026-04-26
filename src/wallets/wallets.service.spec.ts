import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';

const mockWalletsRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockTransactionsRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const makeWallet = (balance: number): Wallet =>
  ({
    id: 'wallet-1',
    userId: 'user-1',
    balance,
    transactions: [],
  }) as unknown as Wallet;

describe('WalletsService', () => {
  let service: WalletsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        { provide: getRepositoryToken(Wallet), useValue: mockWalletsRepo },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionsRepo,
        },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
  });

  describe('findOne()', () => {
    it('lève NotFoundException si le portefeuille n\'existe pas', async () => {
      mockWalletsRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('inexistant')).rejects.toThrow(NotFoundException);
    });

    it('retourne le portefeuille existant', async () => {
      const wallet = makeWallet(100);
      mockWalletsRepo.findOne.mockResolvedValue(wallet);
      const result = await service.findOne('wallet-1');
      expect(result).toEqual(wallet);
    });
  });

  describe('findByUserId()', () => {
    it('lève NotFoundException si aucun portefeuille pour cet utilisateur', async () => {
      mockWalletsRepo.findOne.mockResolvedValue(null);
      await expect(service.findByUserId('user-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deposit()', () => {
    beforeEach(() => {
      mockWalletsRepo.findOne.mockResolvedValue(makeWallet(50));
      mockWalletsRepo.save.mockImplementation((w) => Promise.resolve(w));
      mockTransactionsRepo.create.mockReturnValue({});
      mockTransactionsRepo.save.mockResolvedValue({});
    });

    it('rejette un dépôt de 0€', async () => {
      await expect(service.deposit('wallet-1', { amount: 0 })).rejects.toThrow(BadRequestException);
    });

    it('rejette un dépôt négatif', async () => {
      await expect(service.deposit('wallet-1', { amount: -10 })).rejects.toThrow(BadRequestException);
    });

    it('met à jour le solde après un dépôt valide', async () => {
      const result = await service.deposit('wallet-1', { amount: 50 });
      expect(result.balance).toBe(100);
    });
  });

  describe('withdraw()', () => {
    beforeEach(() => {
      mockWalletsRepo.findOne.mockResolvedValue(makeWallet(50));
      mockWalletsRepo.save.mockImplementation((w) => Promise.resolve(w));
      mockTransactionsRepo.create.mockReturnValue({});
      mockTransactionsRepo.save.mockResolvedValue({});
    });

    it('rejette un retrait de 0€', async () => {
      await expect(service.withdraw('wallet-1', { amount: 0 })).rejects.toThrow(BadRequestException);
    });

    it('rejette un retrait négatif', async () => {
      await expect(service.withdraw('wallet-1', { amount: -5 })).rejects.toThrow(BadRequestException);
    });

    it('rejette un retrait supérieur au solde', async () => {
      await expect(service.withdraw('wallet-1', { amount: 100 })).rejects.toThrow(BadRequestException);
    });

    it('met à jour le solde après un retrait valide', async () => {
      const result = await service.withdraw('wallet-1', { amount: 30 });
      expect(result.balance).toBe(20);
    });
  });

  describe('deductBalance()', () => {
    it('rejette si le solde est insuffisant', async () => {
      mockWalletsRepo.findOne.mockResolvedValue(makeWallet(5));
      await expect(service.deductBalance('wallet-1', 10, 'Achat billet')).rejects.toThrow(BadRequestException);
    });

    it('déduit le montant si le solde est suffisant', async () => {
      mockWalletsRepo.findOne.mockResolvedValue(makeWallet(100));
      mockWalletsRepo.save.mockImplementation((w) => Promise.resolve(w));
      mockTransactionsRepo.create.mockReturnValue({});
      mockTransactionsRepo.save.mockResolvedValue({});

      const result = await service.deductBalance('wallet-1', 10, 'Achat billet');
      expect(result.balance).toBe(90);
    });
  });

  describe('findAll()', () => {
    it('lève NotFoundException si aucun portefeuille existe', async () => {
      mockWalletsRepo.find.mockResolvedValue([]);
      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });
});
