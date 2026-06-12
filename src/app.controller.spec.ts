import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
	let appController: AppController;

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			imports: [JwtModule.register({ secret: 'test-secret' })],
			controllers: [AppController],
			providers: [AppService],
		}).compile();

		appController = app.get<AppController>(AppController);
	});

	describe('root', () => {
		it('should return "Hello World!"', () => {
			expect(appController.getHello()).toBe('Hello World!');
		});
	});

	describe('token', () => {
		it('should create a JWT without an expiration claim', () => {
			const { accessToken } = appController.createToken();
			const payload = JSON.parse(
				Buffer.from(accessToken.split('.')[1], 'base64url').toString(),
			) as Record<string, unknown>;

			expect(payload).toMatchObject({ sub: 'test-user' });
			expect(payload).not.toHaveProperty('exp');
		});
	});
});
