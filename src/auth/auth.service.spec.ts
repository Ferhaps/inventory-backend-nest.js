import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn(() => 'test-token') },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should return access_token on valid credentials', async () => {
    await usersService.create({
      email: 'auth@example.com',
      name: 'Auth User',
      password: 'password123',
    });
    const result = await authService.login('auth@example.com', 'password123');
    expect(result).toHaveProperty('access_token');
  });

  it('should throw UnauthorizedException on invalid credentials', async () => {
    await expect(
      authService.login('nobody@example.com', 'wrong'),
    ).rejects.toThrow('Invalid credentials');
  });
});
