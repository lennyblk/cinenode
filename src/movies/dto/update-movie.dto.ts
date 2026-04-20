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
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  synopsis?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsUrl({}, { each: true })
  posterUrls?: string[];

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(400)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  genre?: string;

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
