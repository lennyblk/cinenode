import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RoomType {
  STANDARD = 'standard',
  IMAX = 'imax',
  FOUR_DX = '4dx',
  VIP = 'vip',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-json' })
  images: string[];

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.STANDARD,
  })
  type: RoomType;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ default: false })
  accessibilityEnabled: boolean;

  @Column({ default: false })
  isUnderMaintenance: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
