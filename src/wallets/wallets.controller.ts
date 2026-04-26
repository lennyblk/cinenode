import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { CreateWalletDto, DepositDto, WithdrawDto } from './dto';

@ApiTags('wallets')
@Controller('wallets')
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @ApiOperation({ summary: 'Lister tous les wallets' })
  @Get()
  findAll() {
    return this.walletsService.findAll();
  }

  @ApiOperation({ summary: 'Récupérer un wallet par ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.walletsService.findOne(id);
  }

  @ApiOperation({ summary: 'Wallet d\'un utilisateur' })
  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.walletsService.findByUserId(userId);
  }

  @ApiOperation({ summary: 'Créer un wallet' })
  @Post()
  create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(createWalletDto);
  }

  @ApiOperation({ summary: 'Déposer de l\'argent' })
  @Post(':id/deposit')
  deposit(@Param('id') id: string, @Body() depositDto: DepositDto) {
    return this.walletsService.deposit(id, depositDto);
  }

  @ApiOperation({ summary: 'Retirer de l\'argent' })
  @Post(':id/withdraw')
  withdraw(@Param('id') id: string, @Body() withdrawDto: WithdrawDto) {
    return this.walletsService.withdraw(id, withdrawDto);
  }

  @ApiOperation({ summary: 'Historique des transactions d\'un wallet' })
  @Get(':id/transactions')
  getTransactionHistory(@Param('id') id: string) {
    return this.walletsService.getTransactionHistory(id);
  }

  @ApiOperation({ summary: 'Supprimer un wallet' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.walletsService.delete(id);
  }
}
