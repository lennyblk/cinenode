import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from 'src/users/entities/refresh-token.entity';
import { Room } from '../rooms/entities/room.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Screening } from '../screenings/entities/screening.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { Transaction } from '../wallets/entities/transaction.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306'),
  username: process.env.DB_USER ?? 'cinenode',
  password: process.env.DB_PASSWORD ?? 'cinenode',
  database: process.env.DB_NAME ?? 'cinenode',
  synchronize: true,
  logging: true,
  entities: [User, RefreshToken, Room, Movie, Screening, Wallet, Transaction, Ticket],
});
