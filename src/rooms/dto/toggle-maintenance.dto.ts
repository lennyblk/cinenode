import { IsBoolean } from 'class-validator';

export class ToggleMaintenanceDto {
  @IsBoolean()
  isUnderMaintenance: boolean;
}
