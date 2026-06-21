import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogService } from '../log/log.service';
import { User, UserDocument } from './user.schema';
import type { UserDto } from './user.dto';

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<UserDocument>,
		private readonly logService: LogService,
	) {}

	async findAll(): Promise<UserDto[]> {
		const users = await this.userModel
			.find({}, { email: 1, role: 1, createdAt: 1, updatedAt: 1 })
			.sort({ createdAt: -1 })
			.exec();
		return users.map((user) => ({
			id: user._id.toString(),
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		}));
	}

	async remove(id: string, actorUserId: string): Promise<void> {
		const result = await this.userModel.findByIdAndDelete(id).exec();
		if (!result) {
			throw new NotFoundException(`User with id ${id} not found`);
		}

		await this.logService.create({
			event: 'USER_DELETE',
			user: actorUserId,
			details: `Deleted user ${result.email}`,
		});
	}
}
