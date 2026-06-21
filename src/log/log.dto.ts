import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LOG_EVENTS } from './types';

export class GetLogsBodyDto {
	@ApiProperty({ example: 25, minimum: 1 })
	pageSize!: number;

	@ApiPropertyOptional()
	user?: string;

	@ApiPropertyOptional()
	product?: string;

	@ApiPropertyOptional()
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
