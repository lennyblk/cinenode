import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { RefreshToken } from 'src/users/entities/refresh-token.entity';
import { AtStrategy } from './strategies';
import { RtStrategy } from './strategies';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev_secret',
      signOptions: { expiresIn: '5m' },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AtStrategy, RtStrategy],
})
export class AuthModule {}
