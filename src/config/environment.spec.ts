import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
	const validEnvironment = {
		PORT: '3000',
		CONNECTION_STRING: 'mongodb://localhost:27017/inventory',
		JWT_SECRET: 'secret',
	};

	it('parses a valid environment', () => {
		expect(validateEnvironment(validEnvironment)).toEqual({
			PORT: 3000,
			CONNECTION_STRING: validEnvironment.CONNECTION_STRING,
			MONGODB_DNS_SERVERS: [],
			JWT_SECRET: validEnvironment.JWT_SECRET,
		});
	});

	it('parses MongoDB DNS servers', () => {
		expect(
			validateEnvironment({
				...validEnvironment,
				MONGODB_DNS_SERVERS: '1.1.1.1, 8.8.8.8',
			}).MONGODB_DNS_SERVERS,
		).toEqual(['1.1.1.1', '8.8.8.8']);
	});

	it('accepts MongoDB SRV connection strings', () => {
		const environment = {
			...validEnvironment,
			CONNECTION_STRING:
				'mongodb+srv://user:password@cluster.example.com/inventory',
		};

		expect(validateEnvironment(environment).CONNECTION_STRING).toBe(
			environment.CONNECTION_STRING,
		);
	});

	it('rejects non-MongoDB connection strings', () => {
		expect(() =>
			validateEnvironment({
				...validEnvironment,
				CONNECTION_STRING: 'postgresql://localhost/inventory',
			}),
		).toThrow('CONNECTION_STRING must be a valid MongoDB connection string');
	});
});
