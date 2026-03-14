import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'cinenode',
  password: 'cinenode',
  database: 'cinenode',
  logging: true,
  entities: [User],
});
