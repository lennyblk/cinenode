import { ConflictException, Injectable } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  async signup(dto: AuthDto) {
    if ((await this.findByEmail(dto.email)) !== null) {
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );
    }
    const hash = await this.hashData(dto.password); // await car la méthode hash appelé renvoit une promesse
    const newUser = this.userRepository.create({ ...dto, password: hash });
    return this.userRepository.save(newUser);
  }

  async signin(dto: AuthDto) {
    if ((await this.findByEmail(dto.email)) == null) {
      throw new ConflictException(
        `User with email ${dto.email} doesnt exists, try to signup`,
      );
    }
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }
  logout() {}
  refreshToken() {}
}
