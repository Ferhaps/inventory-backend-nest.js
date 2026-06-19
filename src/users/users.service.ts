import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogService } from '../log/log.service';
import { UserRole } from './user-role.enum';
import { User, UserDocument } from './user.schema';

export type UserDto = {
	id: string;
	email: string;
	role: UserRole;
};

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<UserDocument>,
		private readonly logService: LogService,
	) {}

	async findAll(): Promise<UserDto[]> {
		const users = await this.userModel.find().exec();
		return users.map((user) => ({
			id: user.id,
			email: user.email,
			role: user.role,
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
