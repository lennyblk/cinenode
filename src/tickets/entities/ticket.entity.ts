import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Screening } from '../../screenings/entities/screening.entity';

export enum TicketType {
  CLASSIC = 'classic',
  SUPER = 'super',
}

@Entity('tickets')
export class Ticket {
  @ApiProperty({ example: 'uuid-v4' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid-de-l-utilisateur' })
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ enum: TicketType, example: TicketType.CLASSIC })
  @Column({
    type: 'enum',
    enum: TicketType,
  })
  type: TicketType;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isUsed: boolean;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @ManyToMany(() => Screening, (screening) => screening.tickets, {
    cascade: true,
  })
  @JoinTable({
    name: 'ticket_screenings',
    joinColumn: { name: 'ticketId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'screeningId', referencedColumnName: 'id' },
  })
  screenings: Screening[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @CreateDateColumn()
  usedAt: Date;
}
