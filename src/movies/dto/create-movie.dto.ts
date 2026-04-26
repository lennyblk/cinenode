import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateMovieDto {
  @ApiProperty({ example: 'Inception', maxLength: 150 })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title: string;

  @ApiProperty({ example: 'Un voleur qui vole des secrets...', minLength: 20, maxLength: 3000 })
  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  synopsis: string;

  @ApiProperty({ example: ['https://example.com/poster.jpg'], type: [String] })
  @IsArray()
  @ArrayMaxSize(8)
  @IsUrl({}, { each: true })
  posterUrls: string[];

  @ApiProperty({ example: 148, minimum: 30, maximum: 400 })
  @IsInt()
  @Min(30)
  @Max(400)
  durationMinutes: number;

  @ApiProperty({ example: 'Science-Fiction', maxLength: 80 })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  genre: string;

  @ApiProperty({ example: '2010-07-16' })
  @IsDateString()
  releaseDate: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
