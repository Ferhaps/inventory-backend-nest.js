export type EnvironmentVariables = {
	PORT: number;
	CONNECTION_STRING: string;
	MONGODB_DNS_SERVERS: string[];
	JWT_SECRET: string;
};

export function validateEnvironment(
	config: Record<string, unknown>,
): EnvironmentVariables {
	const port = Number(config.PORT);

	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error('PORT must be an integer between 1 and 65535');
	}

	const connectionString = requireMongoConnectionString(config);
	const mongoDbDnsServers = parseDnsServers(config.MONGODB_DNS_SERVERS);
	const jwtSecret = requireString(config, 'JWT_SECRET');

	return {
		PORT: port,
		CONNECTION_STRING: connectionString,
		MONGODB_DNS_SERVERS: mongoDbDnsServers,
		JWT_SECRET: jwtSecret,
	};
}

function parseDnsServers(value: unknown): string[] {
	if (value === undefined) {
		return [];
	}

	if (typeof value !== 'string') {
		throw new Error('MONGODB_DNS_SERVERS must be a comma-separated string');
	}

	const dnsServers = value
		.split(',')
		.map((server) => server.trim())
		.filter(Boolean);

	if (dnsServers.length === 0) {
		throw new Error('MONGODB_DNS_SERVERS must contain at least one server');
	}

	return dnsServers;
}

function requireMongoConnectionString(config: Record<string, unknown>): string {
	const connectionString = requireString(config, 'CONNECTION_STRING');

	if (!/^mongodb(\+srv)?:\/\//.test(connectionString)) {
		throw new Error(
			'CONNECTION_STRING must be a valid MongoDB connection string',
		);
	}

	return connectionString;
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
