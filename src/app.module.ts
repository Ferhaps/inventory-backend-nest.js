import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { validateEnvironment } from './config/environment';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			cache: true,
			validate: validateEnvironment,
		}),
		AuthModule,
		DatabaseModule,
		UsersModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
