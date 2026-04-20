import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  title: string;

  @Column({ type: 'text' })
  synopsis: string;

  @Column({ type: 'simple-json' })
  posterUrls: string[];

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({ length: 80 })
  genre: string;

  @Column({ type: 'date' })
  releaseDate: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
