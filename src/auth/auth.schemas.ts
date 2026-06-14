import { z } from 'zod';
import { UserRole } from '../users/user-role.enum';

export const loginSchema = z.object({
	email: z.string().trim().email('Invalid email format').transform(toLowerCase),
	password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
	email: z.string().trim().email('Invalid email format').transform(toLowerCase),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters long')
		.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
		.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
		.regex(/[0-9]/, 'Password must contain at least one number')
		.regex(
			/[!@#$%^&*]/,
			'Password must contain at least one special character',
		),
	role: z.enum(UserRole, {
		error: 'Role must be either ADMIN or OPERATOR',
	}),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

function toLowerCase(value: string): string {
	return value.toLowerCase();
}
