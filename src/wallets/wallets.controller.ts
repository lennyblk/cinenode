import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto, DepositDto, WithdrawDto } from './dto';

@Controller('wallets')
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get()
  findAll() {
    return this.walletsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.walletsService.findOne(id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.walletsService.findByUserId(userId);
  }

  @Post()
  create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(createWalletDto);
  }

  @Post(':id/deposit')
  deposit(@Param('id') id: string, @Body() depositDto: DepositDto) {
    return this.walletsService.deposit(id, depositDto);
  }

  @Post(':id/withdraw')
  withdraw(@Param('id') id: string, @Body() withdrawDto: WithdrawDto) {
    return this.walletsService.withdraw(id, withdrawDto);
  }

  @Get(':id/transactions')
  getTransactionHistory(@Param('id') id: string) {
    return this.walletsService.getTransactionHistory(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.walletsService.delete(id);
  }
}
