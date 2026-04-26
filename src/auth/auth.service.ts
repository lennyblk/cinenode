import {
  ConflictException,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthDto } from './dto/auth.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { Tokens } from './types';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private walletsService: WalletsService,
  ) {}

  hashData(data: string) {
    return bcrypt.hash(data, 10);
  }

  findOne(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async getTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<Tokens> {
    const payload = { userId, email, role };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: 'AtStrategy',
        expiresIn: role === UserRole.ADMIN ? '1y' : '5m',
      }),
      this.jwtService.signAsync(payload, {
        secret: 'RtStrategy',
        expiresIn: '7d',
      }),
    ]);

    // sauvegarde le refresh token en DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        token: refresh_token,
        userId,
        expiresAt,
        isRevoked: false,
      }),
    );

    return { access_token, refresh_token };
  }

  async signup(dto: AuthDto): Promise<Tokens> {
    if ((await this.findByEmail(dto.email)) !== null) {
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );
    }

    const hash = await this.hashData(dto.password);
    const newUser = await this.userRepository.save(
      this.userRepository.create({ ...dto, password: hash }),
    );

    await this.walletsService.create({ userId: newUser.id });

    return this.getTokens(newUser.id, newUser.email, newUser.role);
  }

  async signin(dto: AuthDto): Promise<Tokens> {
    const user = await this.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.getTokens(user.id, user.email, user.role);
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async refreshToken(
    userId: string,
    email: string,
    refreshToken: string,
  ): Promise<Tokens> {
    const tokenInDb = await this.refreshTokenRepository.findOne({
      where: { userId, token: refreshToken },
    });

    if (!tokenInDb) {
      throw new ForbiddenException('Access denid');
    }

    if (tokenInDb.isRevoked) {
      throw new ForbiddenException('Access denid');
    }

    if (tokenInDb.expiresAt < new Date()) {
      throw new ForbiddenException('Access denid');
    }

    await this.refreshTokenRepository.update(tokenInDb.id, {
      isRevoked: true,
    });

    // re fetch de user au cas ou ses roles ont changés
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new ForbiddenException('Access denied');

    return this.getTokens(userId, email, user.role);
  }
}
