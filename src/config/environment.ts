export type EnvironmentVariables = {
	PORT: number;
	CONNECTION_STRING: string;
	JWT_SECRET: string;
};

export function validateEnvironment(
	config: Record<string, unknown>,
): EnvironmentVariables {
	const port = Number(config.PORT);

	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error('PORT must be an integer between 1 and 65535');
	}

	const connectionString = requireString(config, 'CONNECTION_STRING');
	const jwtSecret = requireString(config, 'JWT_SECRET');

	return {
		PORT: port,
		CONNECTION_STRING: connectionString,
		JWT_SECRET: jwtSecret,
	};
}

function requireString(
	config: Record<string, unknown>,
	key: keyof EnvironmentVariables,
): string {
	const value = config[key];

	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${key} must be a non-empty string`);
	}

	return value;
}
