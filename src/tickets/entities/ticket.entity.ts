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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: TicketType,
  })
  type: TicketType;

  @Column({ default: false })
  isUsed: boolean;

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

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  usedAt: Date;
}
