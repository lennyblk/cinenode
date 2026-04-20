import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { RoomType } from '../entities/room.entity';

export class CreateRoomDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  images: string[];

  @IsEnum(RoomType)
  type: RoomType;

  @IsInt()
  @Min(15)
  @Max(30)
  capacity: number;

  @IsOptional()
  @IsBoolean()
  accessibilityEnabled?: boolean;
}
