import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/user.schema';
import { GetLogsBody } from './log.schemas';
import { LOG_EVENTS, Log, LogDocument } from './log.schema';
import type { LogEvent } from './log.schema';

export type LogDto = {
	id: string;
	timestamp: string;
	event: string;
	user?: {
		id: string;
		email: string;
	};
	product?: {
		id: string;
		name: string;
	};
	category?: {
		id: string;
		name: string;
	};
	details?: string;
};

type PopulatedUser = {
	_id: Types.ObjectId;
	email: string;
};

type LeanLog = {
	_id: Types.ObjectId;
	timestamp: Date;
	event: string;
	user?: Types.ObjectId | PopulatedUser | null;
	product?: {
		id: string;
		name: string;
	};
	category?: {
		id: string;
		name: string;
	};
	details?: string;
};

type LogFilter = {
	user?: Types.ObjectId;
	'product.id'?: string;
	'category.id'?: string;
	event?: LogEvent;
	timestamp?: {
		$gte?: Date;
		$lte?: Date;
	};
};

@Injectable()
export class LogService {
	constructor(
		@InjectModel(Log.name)
		private readonly logModel: Model<LogDocument>,
	) {}

	getEvents(): string[] {
		return [...LOG_EVENTS];
	}

	async findByFilter(body: GetLogsBody): Promise<LogDto[]> {
		const filter = buildLogFilter(body);

		const logs = await this.logModel
			.find(filter)
			.sort({ timestamp: -1 })
			.limit(body.pageSize)
			.populate<{ user: PopulatedUser | null }>({
				path: 'user',
				select: 'email',
				model: User.name,
			})
			.lean<LeanLog[]>()
			.exec();

		return logs.map(toLogDto);
	}
}

function buildLogFilter(body: GetLogsBody): LogFilter {
	const filter: LogFilter = {};

	if (body.user) {
		filter.user = toObjectIdOrThrow(body.user, 'user');
	}

	if (body.product) {
		filter['product.id'] = body.product;
	}

	if (body.category) {
		filter['category.id'] = body.category;
	}

	if (body.event) {
		filter.event = body.event;
	}

	if (body.startDate || body.endDate) {
		filter.timestamp = {};

		if (body.startDate) {
			filter.timestamp.$gte = body.startDate;
		}

		if (body.endDate) {
			filter.timestamp.$lte = body.endDate;
		}
	}

	return filter;
}

function toLogDto(log: LeanLog): LogDto {
	return {
		id: log._id.toString(),
		timestamp: log.timestamp.toISOString(),
		event: log.event,
		user: toUserDto(log.user),
		product: log.product,
		category: log.category,
		details: log.details,
	};
}

function toUserDto(user: LeanLog['user']): LogDto['user'] {
	if (!user || user instanceof Types.ObjectId || !('email' in user)) {
		return undefined;
	}

	return {
		id: user._id.toString(),
		email: user.email,
	};
}

function toObjectIdOrThrow(value: string, fieldName: string): Types.ObjectId {
	if (!Types.ObjectId.isValid(value)) {
		throw new BadRequestException(`${fieldName} must be a valid Mongo id`);
	}

	return new Types.ObjectId(value);
}
