import {
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Req,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/jwt.strategy';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './user-role.enum';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import type { UserDto } from './user.dto';

@Controller('/users')
@ApiTags('Users')
@ApiBearerAuth('bearer')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get()
	findAll(): Promise<UserDto[]> {
		return this.usersService.findAll();
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@Roles(UserRole.ADMIN)
	@ApiParam({ name: 'id' })
	remove(
		@Param('id') id: string,
		@Req() request: AuthenticatedRequest,
	): Promise<void> {
		return this.usersService.remove(id, request.user.sub);
	}
}
