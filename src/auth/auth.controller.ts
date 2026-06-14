import { Body, Controller, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UserRole } from '../users/user-role.enum';
import { loginSchema, registerSchema } from './auth.schemas';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { AuthService, AuthUser, LoginResponse } from './auth.service';
import { Public } from './public.decorator';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Public()
	@Post('login')
	login(
		@Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
	): Promise<LoginResponse> {
		return this.authService.login(input);
	}

	@Roles(UserRole.ADMIN)
	@Post('register')
	register(
		@Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
	): Promise<AuthUser> {
		return this.authService.register(input);
	}
}
