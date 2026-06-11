import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { setServers } from 'node:dns';
import { EnvironmentVariables } from '../config/environment';

@Global()
@Module({
	imports: [
		MongooseModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (
				configService: ConfigService<EnvironmentVariables, true>,
			) => {
				const dnsServers = configService.get('MONGODB_DNS_SERVERS', {
					infer: true,
				});

				if (dnsServers.length > 0) {
					setServers(dnsServers);
				}

				return {
					uri: configService.get('CONNECTION_STRING', { infer: true }),
					retryAttempts: 3,
					retryDelay: 3000,
					serverSelectionTimeoutMS: 10000,
				};
			},
		}),
	],
	exports: [MongooseModule],
})
export class DatabaseModule {}
