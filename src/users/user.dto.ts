import { UserRole } from './user-role.enum';
import { UserDocument } from './user.schema';

export type UserDto = {
	id: string;
	email: string;
	role: UserRole;
	createdAt: Date;
	updatedAt: Date;
};

export function toUserDto(user: UserDocument): UserDto {
	return {
		id: user._id.toString(),
		email: user.email,
		role: user.role,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	};
}
