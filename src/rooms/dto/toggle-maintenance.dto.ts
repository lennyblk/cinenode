import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleMaintenanceDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isUnderMaintenance: boolean;
}
