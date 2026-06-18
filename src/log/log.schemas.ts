import { z } from 'zod';
import { LOG_EVENTS } from './log.schema';

const optionalStringFilter = z.string().trim().min(1).optional();

const optionalDateFilter = z.coerce
	.date({ message: 'Date must be a valid date' })
	.optional();

export const getLogsBodySchema = z
	.object({
		pageSize: z.coerce
			.number({ message: 'Page size must be a valid number' })
			.int('Page size must be an integer')
			.positive('Page size must be greater than 0'),
		user: optionalStringFilter,
		product: optionalStringFilter,
		category: optionalStringFilter,
		event: z.enum(LOG_EVENTS).optional(),
		startDate: optionalDateFilter,
		endDate: optionalDateFilter,
	})
	.refine(
		(body) =>
			!body.startDate ||
			!body.endDate ||
			body.startDate.getTime() <= body.endDate.getTime(),
		{
			message: 'Start date must be before or equal to end date',
			path: ['startDate'],
		},
	);

export type GetLogsBody = z.infer<typeof getLogsBodySchema>;
