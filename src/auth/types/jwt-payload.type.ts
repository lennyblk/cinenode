import { UserRole } from '../../users/entities/user.entity';

export type JwtPayload = {
  userId: string;
  email: string;
  role: UserRole;
};
