import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private nextId = 1;

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existing = this.users.find((u) => u.email === createUserDto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashed = await bcrypt.hash(createUserDto.password, 10);
    const user: User = {
      id: this.nextId++,
      email: createUserDto.email,
      name: createUserDto.name,
      password: hashed,
    };
    this.users.push(user);
    const { password: _, ...result } = user;
    return result;
  }

  findAll(): Omit<User, 'password'>[] {
    return this.users.map(({ password: _, ...rest }) => rest);
  }

  findOne(id: number): Omit<User, 'password'> {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    const { password: _, ...result } = user;
    return result;
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (updateUserDto.email && updateUserDto.email !== this.users[index].email) {
      const emailTaken = this.users.find(
        (u) => u.email === updateUserDto.email,
      );
      if (emailTaken) {
        throw new ConflictException('Email already in use');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    this.users[index] = { ...this.users[index], ...updateUserDto };
    const { password: _, ...result } = this.users[index];
    return result;
  }

  remove(id: number): void {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new NotFoundException(`User #${id} not found`);
    }
    this.users.splice(index, 1);
  }
}
