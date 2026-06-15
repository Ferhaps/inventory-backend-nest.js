import {
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './user-role.enum';
import { UserDto, UsersService } from './users.service';

@Controller('/users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get()
	findAll(): Promise<UserDto[]> {
		return this.usersService.findAll();
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@Roles(UserRole.ADMIN)
	remove(@Param('id') id: string): Promise<void> {
		return this.usersService.remove(id);
	}
}
