import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/environment';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const logger = new Logger('Bootstrap');
	const databaseConnection = app.get<Connection>(getConnectionToken());
	const configService =
		app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
	const port = configService.get('PORT', { infer: true });

	logger.log(`MongoDB connected to database "${databaseConnection.name}"`);

	await app.listen(port);
	logger.log(`Server is running on http://localhost:${port}`);
}
void bootstrap();
