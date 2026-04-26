import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateMovieDto {
  @ApiPropertyOptional({ example: 'Inception', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ example: 'Un voleur qui vole des secrets...', minLength: 20, maxLength: 3000 })
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  synopsis?: string;

  @ApiPropertyOptional({ example: ['https://example.com/poster.jpg'], type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsUrl({}, { each: true })
  posterUrls?: string[];

  @ApiPropertyOptional({ example: 148, minimum: 30, maximum: 400 })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(400)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Science-Fiction', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  genre?: string;

  @ApiPropertyOptional({ example: '2010-07-16' })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
