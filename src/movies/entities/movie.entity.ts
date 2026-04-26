import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('movies')
export class Movie {
  @ApiProperty({ example: 'uuid-v4' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Inception' })
  @Column({ unique: true })
  title: string;

  @ApiProperty({ example: 'Un voleur qui vole des secrets...' })
  @Column({ type: 'text' })
  synopsis: string;

  @ApiProperty({ example: ['https://example.com/poster.jpg'], type: [String] })
  @Column({ type: 'simple-json' })
  posterUrls: string[];

  @ApiProperty({ example: 148 })
  @Column({ type: 'int' })
  durationMinutes: number;

  @ApiProperty({ example: 'Science-Fiction' })
  @Column({ length: 80 })
  genre: string;

  @ApiProperty({ example: '2010-07-16' })
  @Column({ type: 'date' })
  releaseDate: string;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
