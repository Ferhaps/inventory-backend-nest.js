import { BadRequestException } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UserRole } from '../users/user-role.enum';
import { loginSchema, registerSchema } from './auth.schemas';

describe('authentication schemas', () => {
	it('normalizes a valid login email', () => {
		const result = loginSchema.parse({
			email: '  USER@Example.COM ',
			password: 'password',
		});

		expect(result.email).toBe('user@example.com');
	});

	it('requires every registration password rule', () => {
		const result = registerSchema.safeParse({
			email: 'user@example.com',
			password: 'password',
			role: UserRole.OPERATOR,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((issue) => issue.message)).toEqual(
				expect.arrayContaining([
					'Password must contain at least one uppercase letter',
					'Password must contain at least one number',
					'Password must contain at least one special character',
				]),
			);
		}
	});

	it('returns registration validation messages as a bad request', () => {
		const pipe = new ZodValidationPipe(registerSchema);

		expect(() =>
			pipe.transform({
				email: 'invalid',
				password: 'short',
				role: 'USER',
			}),
		).toThrow(BadRequestException);
	});
});
