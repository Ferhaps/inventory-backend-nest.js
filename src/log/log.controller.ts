import { Body, Controller, Get, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { getLogsBodySchema } from './log.schemas';
import { LogService } from './log.service';
import type { GetLogsBody } from './log.schemas';
import type { LogDto } from './types';

@Controller('/log')
export class LogController {
	constructor(private readonly logService: LogService) {}

	@Get('events')
	getEvents(): string[] {
		return this.logService.getEvents();
	}

	@Post()
	findByFilter(
		@Body(new ZodValidationPipe(getLogsBodySchema)) body: GetLogsBody,
	): Promise<LogDto[]> {
		return this.logService.findByFilter(body);
	}
}
