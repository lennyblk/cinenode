import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Salle 1', maxLength: 80 })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'Grande salle équipée IMAX', maxLength: 1000 })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @ApiProperty({ example: ['https://example.com/room.jpg'], type: [String] })
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  images: string[];

  @ApiProperty({ enum: RoomType, example: RoomType.STANDARD })
  @IsEnum(RoomType)
  type: RoomType;

  @ApiProperty({ example: 20, minimum: 15, maximum: 30 })
  @IsInt()
  @Min(15)
  @Max(30)
  capacity: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  accessibilityEnabled?: boolean;
}
