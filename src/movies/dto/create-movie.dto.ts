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
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title: string;

  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  synopsis: string;

  @IsArray()
  @ArrayMaxSize(8)
  @IsUrl({}, { each: true })
  posterUrls: string[];

  @IsInt()
  @Min(30)
  @Max(400)
  durationMinutes: number;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  genre: string;

  @IsDateString()
  releaseDate: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
