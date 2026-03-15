import { ConflictException, Injectable } from '@nestjs/common';
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

  findOne(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async signup(dto: AuthDto) {
    if ((await this.findByEmail(dto.email)) !== null) {
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );
    }
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }

  signin() {}
  logout() {}
  refreshToken() {}
}
