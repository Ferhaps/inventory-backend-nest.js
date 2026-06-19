import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { compare, hash } from 'bcrypt';
import { Model } from 'mongoose';
import { LogService } from '../log/log.service';
import { User, UserDocument } from '../users/user.schema';
import { LoginInput, RegisterInput } from './auth.schemas';
import { JwtPayload } from './jwt.strategy';

export type AuthUser = {
	id: string;
	email: string;
	role: User['role'];
};

export type LoginResponse = {
	user: AuthUser;
	token: string;
};

@Injectable()
export class AuthService {
	private static readonly PASSWORD_SALT_ROUNDS = 12;

	constructor(
		@InjectModel(User.name)
		private readonly userModel: Model<User>,
		private readonly jwtService: JwtService,
		private readonly logService: LogService,
	) {}

	async login(input: LoginInput): Promise<LoginResponse> {
		const email = normalizeEmail(input.email);
		const user = await this.userModel
			.findOne({ email })
			.select('+password')
			.exec();

		if (!user || !(await compare(input.password, user.password))) {
			throw new UnauthorizedException('Invalid email or password');
		}

		const responseUser = toAuthUser(user);
		const payload: JwtPayload = {
			sub: responseUser.id,
			email: responseUser.email,
			role: responseUser.role,
		};

		await this.logService.create({
			event: 'USER_LOGIN',
			user: user._id,
		});

		return {
			user: responseUser,
			token: this.jwtService.sign(payload),
		};
	}

	async register(input: RegisterInput, actorUserId: string): Promise<AuthUser> {
		const email = normalizeEmail(input.email);
		const password = await hash(
			input.password,
			AuthService.PASSWORD_SALT_ROUNDS,
		);

		try {
			const user = await this.userModel.create({
				email,
				password,
				role: input.role,
			});

			await this.logService.create({
				event: 'USER_REGISTER',
				user: actorUserId,
				details: `Registered user ${user.email}`,
			});

			return toAuthUser(user);
		} catch (error: unknown) {
			if (isDuplicateKeyError(error)) {
				throw new ConflictException('Email is already registered');
			}

			throw error;
		}
	}
}

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function toAuthUser(user: UserDocument): AuthUser {
	return {
		id: user._id.toString(),
		email: user.email,
		role: user.role,
	};
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		error.code === 11000
	);
}
