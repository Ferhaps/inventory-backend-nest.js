import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcrypt';
import { Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/users/user-role.enum';
import { User } from '../src/users/user.schema';

type LoginBody = {
	user: {
		id: string;
		email: string;
		role: UserRole;
	};
	token: string;
};

type ErrorBody = {
	message: string | string[];
};

describe('Authentication (e2e)', () => {
	let app: INestApplication<App>;
	let mongoServer: MongoMemoryServer;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		process.env.PORT = '3000';
		process.env.CONNECTION_STRING = mongoServer.getUri('inventory');
		process.env.JWT_SECRET = 'e2e-test-secret';
		delete process.env.MONGODB_DNS_SERVERS;

		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();

		const userModel = app.get<Model<User>>(getModelToken(User.name));
		await userModel.syncIndexes();
		await userModel.create({
			email: 'admin@example.com',
			password: await hash('AdminPassword1!', 4),
			role: UserRole.ADMIN,
		});
	});

	it('logs in and returns the public user with a non-expiring JWT', async () => {
		const response = await request(app.getHttpServer())
			.post('/auth/login')
			.send({
				email: ' ADMIN@Example.COM ',
				password: 'AdminPassword1!',
			})
			.expect(201);
		const body = response.body as LoginBody;

		expect(typeof body.user.id).toBe('string');
		expect(body.user.email).toBe('admin@example.com');
		expect(body.user.role).toBe(UserRole.ADMIN);
		expect(typeof body.token).toBe('string');

		const payload = JSON.parse(
			Buffer.from(body.token.split('.')[1], 'base64url').toString(),
		) as Record<string, unknown>;
		expect(payload).toMatchObject({
			sub: body.user.id,
			email: 'admin@example.com',
			role: UserRole.ADMIN,
		});
		expect(payload).not.toHaveProperty('exp');
	});

	it('allows ADMIN registration and rejects duplicate email casing', async () => {
		const adminToken = await login('admin@example.com', 'AdminPassword1!');

		const registerResponse = await request(app.getHttpServer())
			.post('/auth/register')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				email: ' Operator@Example.COM ',
				password: 'OperatorPassword1!',
				role: UserRole.OPERATOR,
			})
			.expect(201);
		const registeredUser = registerResponse.body as LoginBody['user'];
		expect(typeof registeredUser.id).toBe('string');
		expect(registeredUser.email).toBe('operator@example.com');
		expect(registeredUser.role).toBe(UserRole.OPERATOR);

		await request(app.getHttpServer())
			.post('/auth/register')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				email: 'OPERATOR@example.com',
				password: 'OperatorPassword1!',
				role: UserRole.OPERATOR,
			})
			.expect(409);
	});

	it('rejects registration without a token or with an OPERATOR token', async () => {
		await request(app.getHttpServer())
			.post('/auth/register')
			.send(validRegistration('other@example.com'))
			.expect(401);

		const operatorToken = await login(
			'operator@example.com',
			'OperatorPassword1!',
		);

		await request(app.getHttpServer())
			.post('/auth/register')
			.set('Authorization', `Bearer ${operatorToken}`)
			.send(validRegistration('other@example.com'))
			.expect(403);
	});

	it('validates requests and returns generic invalid credentials', async () => {
		const invalidLogin = await request(app.getHttpServer())
			.post('/auth/login')
			.send({ email: 'invalid', password: '' })
			.expect(400);
		const invalidLoginBody = invalidLogin.body as ErrorBody;
		expect(invalidLoginBody.message).toEqual(
			expect.arrayContaining(['Invalid email format', 'Password is required']),
		);

		const invalidCredentials = await request(app.getHttpServer())
			.post('/auth/login')
			.send({
				email: 'admin@example.com',
				password: 'WrongPassword1!',
			})
			.expect(401);
		expect((invalidCredentials.body as ErrorBody).message).toBe(
			'Invalid email or password',
		);
	});

	it('does not expose the removed token endpoint', () => {
		return request(app.getHttpServer()).post('/token').expect(404);
	});

	async function login(email: string, password: string): Promise<string> {
		const response = await request(app.getHttpServer())
			.post('/auth/login')
			.send({ email, password })
			.expect(201);

		return (response.body as LoginBody).token;
	}

	afterAll(async () => {
		await app.close();
		await mongoServer.stop();
	});
});

function validRegistration(email: string) {
	return {
		email,
		password: 'OtherPassword1!',
		role: UserRole.OPERATOR,
	};
}
