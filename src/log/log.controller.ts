import { Body, Controller, Get, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { getLogsBodySchema } from './log.schemas';
import { LogService } from './log.service';
import type { GetLogsBody } from './log.schemas';
import type { LogDto } from './types';
import {
	ApiBearerAuth,
	ApiBody,
	ApiProperty,
	ApiPropertyOptional,
	ApiTags,
} from '@nestjs/swagger';
import { LOG_EVENTS } from './types';

class GetLogsBodyDto {
	@ApiProperty({ example: 25, minimum: 1 })
	pageSize!: number;

	@ApiPropertyOptional({ example: '6869bb4a4fa3b392b0cbab1a' })
	user?: string;

	@ApiPropertyOptional({ example: '6869bb4a4fa3b392b0cbab1a' })
	product?: string;

	@ApiPropertyOptional({ example: '6869bb4a4fa3b392b0cbab1a' })
	category?: string;

	@ApiPropertyOptional({ enum: LOG_EVENTS, example: 'PRODUCT_CREATE' })
	event?: (typeof LOG_EVENTS)[number];

	@ApiPropertyOptional({
		example: '2026-01-01T00:00:00.000Z',
		description: 'ISO timestamp',
	})
	startDate?: string;

	@ApiPropertyOptional({
		example: '2026-01-31T23:59:59.999Z',
		description: 'ISO timestamp',
	})
	endDate?: string;
}

@Controller('/log')
@ApiTags('Log')
@ApiBearerAuth('bearer')
export class LogController {
	constructor(private readonly logService: LogService) {}

	@Get('events')
	getEvents(): string[] {
		return this.logService.getEvents();
	}

	@Post()
	@ApiBody({ type: GetLogsBodyDto })
	findByFilter(
		@Body(new ZodValidationPipe(getLogsBodySchema)) body: GetLogsBody,
	): Promise<LogDto[]> {
		return this.logService.findByFilter(body);
	}
}
