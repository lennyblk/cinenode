import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { Movie } from '../../movies/entities/movie.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity('screenings')
export class Screening {
  @ApiProperty({ example: 'uuid-v4' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid-de-la-salle' })
  @Column()
  roomId: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ApiProperty({ example: 'uuid-du-film' })
  @Column()
  movieId: string;

  @ManyToOne(() => Movie, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movieId' })
  movie: Movie;

  @ApiProperty({ example: '2026-05-01T20:00:00.000Z' })
  @Column({ type: 'datetime' })
  startsAt: Date;

  @ApiProperty({ example: '2026-05-01T22:30:00.000Z' })
  @Column({ type: 'datetime' })
  endsAt: Date;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isCancelled: boolean;

  @ManyToMany(() => Ticket, (ticket) => ticket.screenings)
  tickets: Ticket[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
