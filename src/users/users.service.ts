import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LogService } from '../log/log.service';
import { UserRole } from './user-role.enum';
import { User, UserDocument } from './user.schema';

export type UserDto = {
	id: string;
	email: string;
	role: UserRole;
	createdAt: Date;
	updatedAt: Date;
};

type UserListItem = {
	_id: Types.ObjectId;
	email: string;
	role: UserRole;
	createdAt: Date;
	updatedAt: Date;
};

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
			.lean<UserListItem[]>()
			.exec();
		return users.map((user) => ({
			...user,
			id: user._id.toString(),
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
