import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'uuid-v4' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Salle 1' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ example: 'Grande salle équipée IMAX' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: ['https://example.com/room.jpg'], type: [String] })
  @Column({ type: 'simple-json' })
  images: string[];

  @ApiProperty({ enum: RoomType, example: RoomType.STANDARD })
  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.STANDARD,
  })
  type: RoomType;

  @ApiProperty({ example: 20 })
  @Column({ type: 'int' })
  capacity: number;

  @ApiProperty({ example: false })
  @Column({ default: false })
  accessibilityEnabled: boolean;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isUnderMaintenance: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
