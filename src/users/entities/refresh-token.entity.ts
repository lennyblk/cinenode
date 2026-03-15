import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isRevoked: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' }) //  'CASCADE' => si jamais on supp un user, ca supp tout ses refresh tokens
  @JoinColumn({ name: 'userId' })
  user: User; // ici on peut faire le lien directement avec tout l'objet car typeorm choisi automatiquement la primaryKey (qui est id)

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
