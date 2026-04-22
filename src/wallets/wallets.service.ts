import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { CreateWalletDto, DepositDto, WithdrawDto } from './dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletsRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  async create(createWalletDto: CreateWalletDto) {
    const wallet = this.walletsRepository.create(createWalletDto);
    return this.walletsRepository.save(wallet);
  }

  async findAll() {
    const wallets = await this.walletsRepository.find({
      relations: ['user', 'transactions'],
    });
    if (wallets.length === 0) {
      throw new NotFoundException('No wallets found');
    }
    return wallets;
  }

  async findOne(id: string) {
    const wallet = await this.walletsRepository.findOne({
      where: { id },
      relations: ['user', 'transactions'],
    });
    if (!wallet) {
      throw new NotFoundException(`Wallet with id ${id} not found`);
    }
    return wallet;
  }

  async findByUserId(userId: string) {
    const wallet = await this.walletsRepository.findOne({
      where: { userId },
      relations: ['user', 'transactions'],
    });
    if (!wallet) {
      throw new NotFoundException(`Wallet for user ${userId} not found`);
    }
    return wallet;
  }

  async deposit(walletId: string, depositDto: DepositDto) {
    const wallet = await this.findOne(walletId);

    if (depositDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    wallet.balance = parseFloat(wallet.balance.toString()) + depositDto.amount;
    await this.walletsRepository.save(wallet);

    const transaction = this.transactionsRepository.create({
      walletId,
      type: TransactionType.DEPOSIT,
      amount: depositDto.amount,
      description: depositDto.description,
    });
    await this.transactionsRepository.save(transaction);

    return wallet;
  }

  async withdraw(walletId: string, withdrawDto: WithdrawDto) {
    const wallet = await this.findOne(walletId);

    if (withdrawDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const currentBalance = parseFloat(wallet.balance.toString());
    if (currentBalance < withdrawDto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    wallet.balance = currentBalance - withdrawDto.amount;
    await this.walletsRepository.save(wallet);

    const transaction = this.transactionsRepository.create({
      walletId,
      type: TransactionType.WITHDRAW,
      amount: withdrawDto.amount,
      description: withdrawDto.description,
    });
    await this.transactionsRepository.save(transaction);

    return wallet;
  }

  async getTransactionHistory(walletId: string) {
    const wallet = await this.findOne(walletId);
    const transactions = await this.transactionsRepository.find({
      where: { walletId },
      order: { createdAt: 'DESC' },
    });
    return {
      wallet,
      transactions,
    };
  }

  async deductBalance(walletId: string, amount: number, description: string) {
    const wallet = await this.findOne(walletId);

    const currentBalance = parseFloat(wallet.balance.toString());
    if (currentBalance < amount) {
      throw new BadRequestException('Insufficient balance for this transaction');
    }

    wallet.balance = currentBalance - amount;
    await this.walletsRepository.save(wallet);

    const transaction = this.transactionsRepository.create({
      walletId,
      type: TransactionType.TICKET_PURCHASE,
      amount,
      description,
    });
    await this.transactionsRepository.save(transaction);

    return wallet;
  }

  async delete(id: string) {
    const walletDeleted = await this.walletsRepository.delete(id);
    if (walletDeleted.affected === 0) {
      return { message: `Wallet with id ${id} not found` };
    }
    return { message: `Wallet with id ${id} has been deleted` };
  }
}
