import { Body, Controller, Post, Req } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UserRole } from '../users/user-role.enum';
import { loginSchema, registerSchema } from './auth.schemas';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { AuthService, LoginResponse } from './auth.service';
import type { AuthenticatedRequest } from './jwt.strategy';
import { Public } from './public.decorator';
import { Roles } from './roles.decorator';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiProperty,
	ApiTags,
} from '@nestjs/swagger';
import type { UserDto } from 'src/users/user.dto';

class LoginBodyDto {
	@ApiProperty({
		example: 'operator@inventory.local',
		description: 'User email address',
	})
	email!: string;

	@ApiProperty({ example: 'P@ssw0rd!' })
	password!: string;
}

class RegisterBodyDto extends LoginBodyDto {
	@ApiProperty({ enum: UserRole, example: UserRole.OPERATOR })
	role!: UserRole;
}

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Public()
	@Post('login')
	@ApiOperation({ summary: 'Login and receive a JWT access token' })
	@ApiBody({ type: LoginBodyDto })
	login(
		@Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
	): Promise<LoginResponse> {
		return this.authService.login(input);
	}

	@Roles(UserRole.ADMIN)
	@Post('register')
	@ApiBearerAuth('bearer')
	@ApiOperation({ summary: 'Register a new user (admin only)' })
	@ApiBody({ type: RegisterBodyDto })
	register(
		@Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
		@Req() request: AuthenticatedRequest,
	): Promise<UserDto> {
		return this.authService.register(input, request.user.sub);
	}
}
