import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'docs';

export function setupSwagger(app: INestApplication): void {
	const swaggerConfig = new DocumentBuilder()
		.setTitle('Inventory Backend API')
		.setDescription('API documentation for the Inventory backend service.')
		.setVersion('1.0.0')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				in: 'header',
				name: 'Authorization',
				description:
					'JWT access token. Format: Bearer <token>. Obtain one from POST /api/auth/login.',
			},
			'bearer',
		)
		.build();

	const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

	SwaggerModule.setup(SWAGGER_PATH, app, swaggerDocument, {
		useGlobalPrefix: true,
		swaggerOptions: {
			persistAuthorization: true,
			tagsSorter: 'alpha',
			operationsSorter: 'alpha',
		},
		customSiteTitle: 'Inventory API Docs',
	});
}
