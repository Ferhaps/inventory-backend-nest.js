import { Body, Controller, Post, Req } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UserRole } from '../users/user-role.enum';
import { loginSchema, registerSchema } from './auth.schemas';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { AuthService, AuthUser, LoginResponse } from './auth.service';
import type { AuthenticatedRequest } from './jwt.strategy';
import { Public } from './public.decorator';
import { Roles } from './roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Public()
	@Post('login')
	@ApiOperation({ summary: 'Login and receive a JWT access token' })
	login(
		@Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
	): Promise<LoginResponse> {
		return this.authService.login(input);
	}

	@Roles(UserRole.ADMIN)
	@Post('register')
	@ApiBearerAuth('bearer')
	@ApiOperation({ summary: 'Register a new user (admin only)' })
	register(
		@Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
		@Req() request: AuthenticatedRequest,
	): Promise<AuthUser> {
		return this.authService.register(input, request.user.sub);
	}
}
