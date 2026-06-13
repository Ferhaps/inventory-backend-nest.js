import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    const user = await service.create({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    });
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
    expect((user as any).password).toBeUndefined();
  });

  it('should throw on duplicate email', async () => {
    await service.create({
      email: 'dup@example.com',
      name: 'First',
      password: 'password123',
    });
    await expect(
      service.create({
        email: 'dup@example.com',
        name: 'Second',
        password: 'password123',
      }),
    ).rejects.toThrow('Email already in use');
  });

  it('should find all users', async () => {
    await service.create({
      email: 'a@example.com',
      name: 'A',
      password: 'password123',
    });
    const users = service.findAll();
    expect(users.length).toBeGreaterThan(0);
  });

  it('should throw NotFoundException for unknown id', () => {
    expect(() => service.findOne(9999)).toThrow('not found');
  });
});
