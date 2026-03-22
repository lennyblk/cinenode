import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthDto } from './dto/auth.dto';
import { User } from '../users/entities/user.entity';
import { Tokens } from './types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
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

  async getTokens(userId: string, email: string): Promise<Tokens> {
    const payload = { userId, email };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: 'AtStrategy',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: 'RtStrategy',
        expiresIn: '7d',
      }),
    ]);

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

    return this.getTokens(newUser.id, newUser.email);
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

    return this.getTokens(user.id, user.email);
  }

  logout() {}
  refreshToken() {}
}
