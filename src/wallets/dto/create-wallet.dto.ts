import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({ example: 'uuid-de-l-utilisateur' })
  @IsUUID()
  userId: string;
}
