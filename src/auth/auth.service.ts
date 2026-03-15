import { Injectable } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async signup(dto: AuthDto) {
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  signin() {}
  logout() {}
  refreshToken() {}
}
