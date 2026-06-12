import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
	let app: INestApplication<App>;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	it('rejects requests without a JWT', () => {
		return request(app.getHttpServer()).get('/').expect(401);
	});

	it('accepts a JWT issued by the existing controller', async () => {
		const tokenResponse = await request(app.getHttpServer())
			.post('/token')
			.expect(201);
		const tokenBody = tokenResponse.body as { accessToken: string };

		await request(app.getHttpServer())
			.get('/')
			.set('Authorization', `Bearer ${tokenBody.accessToken}`)
			.expect(200)
			.expect('Hello World!');
	});

	afterEach(async () => {
		await app.close();
	});
});
