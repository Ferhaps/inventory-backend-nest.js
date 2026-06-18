import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/user.schema';
import { LogController } from './log.controller';
import { Log, LogSchema } from './log.schema';
import { LogService } from './log.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Log.name, schema: LogSchema },
			{ name: User.name, schema: UserSchema },
		]),
	],
	controllers: [LogController],
	providers: [LogService],
})
export class LogModule {}
