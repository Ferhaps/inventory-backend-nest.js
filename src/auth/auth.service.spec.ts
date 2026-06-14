import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { Model, Types } from 'mongoose';
import { UserRole } from '../users/user-role.enum';
import { User, UserDocument } from '../users/user.schema';
import { AuthService } from './auth.service';

describe('AuthService', () => {
	const jwtService = {
		sign: jest.fn(() => 'signed-token'),
	};
	const userModel = {
		create: jest.fn(),
		findOne: jest.fn(),
	};
	const service = new AuthService(
		userModel as unknown as Model<User>,
		jwtService as unknown as JwtService,
	);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('normalizes the email, hashes the password, and omits it from registration', async () => {
		let createdUser: User | undefined;
		userModel.create.mockImplementation((input: User) => {
			createdUser = input;
			return Promise.resolve(createUser(input));
		});

		const result = await service.register({
			email: '  ADMIN@Example.COM ',
			password: 'Password1!',
			role: UserRole.ADMIN,
		});

		expect(createdUser).toBeDefined();
		expect(createdUser!.email).toBe('admin@example.com');
		expect(createdUser!.password).not.toBe('Password1!');
		expect(await compare('Password1!', createdUser!.password)).toBe(true);
		expect(typeof result.id).toBe('string');
		expect(result.email).toBe('admin@example.com');
		expect(result.role).toBe(UserRole.ADMIN);
		expect(result).not.toHaveProperty('password');
	});

	it('maps duplicate emails to conflict', async () => {
		userModel.create.mockRejectedValue({ code: 11000 });

		await expect(
			service.register({
				email: 'user@example.com',
				password: 'Password1!',
				role: UserRole.OPERATOR,
			}),
		).rejects.toBeInstanceOf(ConflictException);
	});

	it('logs in with normalized email and signs the expected payload', async () => {
		const user = createUser({
			email: 'user@example.com',
			password: await hash('Password1!', 4),
			role: UserRole.OPERATOR,
		});
		const exec = jest.fn().mockResolvedValue(user);
		const select = jest.fn().mockReturnValue({ exec });
		userModel.findOne.mockReturnValue({ select });

		const result = await service.login({
			email: ' USER@Example.COM ',
			password: 'Password1!',
		});

		expect(userModel.findOne).toHaveBeenCalledWith({
			email: 'user@example.com',
		});
		expect(select).toHaveBeenCalledWith('+password');
		expect(jwtService.sign).toHaveBeenCalledWith({
			sub: user._id.toString(),
			email: user.email,
			role: user.role,
		});
		expect(result.token).toBe('signed-token');
	});

	it('uses the same unauthorized response for missing users and bad passwords', async () => {
		const selectMissing = jest.fn().mockReturnValue({
			exec: jest.fn().mockResolvedValue(null),
		});
		userModel.findOne.mockReturnValueOnce({ select: selectMissing });

		await expect(
			service.login({
				email: 'missing@example.com',
				password: 'Password1!',
			}),
		).rejects.toEqual(
			expect.objectContaining({
				message: 'Invalid email or password',
			}),
		);

		const user = createUser({
			email: 'user@example.com',
			password: await hash('Password1!', 4),
			role: UserRole.OPERATOR,
		});
		const selectExisting = jest.fn().mockReturnValue({
			exec: jest.fn().mockResolvedValue(user),
		});
		userModel.findOne.mockReturnValueOnce({ select: selectExisting });

		await expect(
			service.login({
				email: 'user@example.com',
				password: 'WrongPassword1!',
			}),
		).rejects.toBeInstanceOf(UnauthorizedException);
	});
});

function createUser(input: User): UserDocument {
	return {
		_id: new Types.ObjectId(),
		...input,
	} as UserDocument;
}
