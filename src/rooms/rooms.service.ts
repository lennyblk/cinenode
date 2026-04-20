import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Screening } from '../screenings/entities/screening.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepository: Repository<Room>,
    @InjectRepository(Screening)
    private readonly screeningsRepository: Repository<Screening>,
  ) {}

  findAll() {
    return this.roomsRepository.find({ order: { createdAt: 'ASC' } });
  }

  async findOne(id: string) {
    const room = await this.roomsRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }
    return room;
  }

  async create(createRoomDto: CreateRoomDto) {
    const existingRoom = await this.roomsRepository.findOne({
      where: { name: createRoomDto.name },
    });
    if (existingRoom) {
      throw new ConflictException(
        `Room with name ${createRoomDto.name} already exists`,
      );
    }

    const room = this.roomsRepository.create({
      ...createRoomDto,
      accessibilityEnabled: createRoomDto.accessibilityEnabled ?? false,
      isUnderMaintenance: false,
    });
    return this.roomsRepository.save(room);
  }

  async update(id: string, updateRoomDto: UpdateRoomDto) {
    const existingRoom = await this.findOne(id);

    if (updateRoomDto.name && updateRoomDto.name !== existingRoom.name) {
      const roomWithSameName = await this.roomsRepository.findOne({
        where: { name: updateRoomDto.name },
      });

      if (roomWithSameName && roomWithSameName.id !== id) {
        throw new ConflictException(
          `Room with name ${updateRoomDto.name} already exists`,
        );
      }
    }

    await this.roomsRepository.update(id, updateRoomDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const room = await this.findOne(id);
    await this.roomsRepository.delete(id);
    return {
      message: `Room ${room.name} deleted`,
    };
  }

  async toggleMaintenance(id: string, isUnderMaintenance: boolean) {
    await this.findOne(id);
    await this.roomsRepository.update(id, { isUnderMaintenance });
    return this.findOne(id);
  }

  async getRoomSchedule(id: string, from: string, to: string) {
    const room = await this.findOne(id);

    if (room.isUnderMaintenance) {
      return {
        roomId: id,
        from,
        to,
        screenings: [],
      };
    }

    const screenings = await this.screeningsRepository
      .createQueryBuilder('screening')
      .leftJoinAndSelect('screening.movie', 'movie')
      .leftJoinAndSelect('screening.room', 'room')
      .where('screening.roomId = :id', { id })
      .andWhere('screening.isCancelled = :isCancelled', { isCancelled: false })
      .andWhere('screening.startsAt <= :to', { to })
      .andWhere('screening.endsAt >= :from', { from })
      .orderBy('screening.startsAt', 'ASC')
      .getMany();

    return {
      roomId: id,
      from,
      to,
      screenings,
    };
  }
}
