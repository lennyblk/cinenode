import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private walletsService: WalletsService,
  ) {}

  async findAll() {
    const users = await this.usersRepository.find();
    if (users.length === 0) {
      throw new NotFoundException('No users found');
    }
    return users;
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }
  async create(createUserDto: CreateUserDto) {
    if ((await this.findByEmail(createUserDto.email)) !== null) {
      throw new ConflictException(
        `User with email ${createUserDto.email} already exists`,
      );
    }

    const user = this.usersRepository.create(createUserDto);
    const savedUser = await this.usersRepository.save(user);

    await this.walletsService.create({ userId: savedUser.id });

    return savedUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (updateUserDto.email) {
      const userWithSameEmail = await this.findByEmail(updateUserDto.email);
      if (userWithSameEmail && userWithSameEmail.id !== id) {
        throw new ConflictException(
          `User with email ${updateUserDto.email} already exists`,
        );
      }
    }

    await this.usersRepository.update(id, updateUserDto);
    return this.usersRepository.findOne({ where: { id } });
  }

  async delete(id: string) {
    const userDeleted = await this.usersRepository.delete(id);
    if (userDeleted.affected === 0) {
      return { message: `User with id ${id} not found` };
    }
    return { message: `User with id ${id} has been deleted` };
  }
}
