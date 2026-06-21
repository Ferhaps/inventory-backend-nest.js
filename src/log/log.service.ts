import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/user.schema';
import { GetLogsBody } from './log.schemas';
import { Log, LogDocument } from './log.schema';
import {
	CreateLogInput,
	LeanLog,
	LOG_EVENTS,
	LogDto,
	LogFilter,
	PopulatedUser,
} from './types';

@Injectable()
export class LogService {
	constructor(
		@InjectModel(Log.name)
		private readonly logModel: Model<LogDocument>,
	) {}

	getEvents(): string[] {
		return [...LOG_EVENTS];
	}

	async create(input: CreateLogInput): Promise<void> {
		await this.logModel.create({
			event: input.event,
			user: toObjectId(input.user, 'user'),
			product: toLogEntitySnapshot(input.product, 'product'),
			category: toLogEntitySnapshot(input.category, 'category'),
			details: input.details,
		});
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
		filter['product.id'] = toObjectIdOrThrow(body.product, 'product');
	}

	if (body.category) {
		filter['category.id'] = toObjectIdOrThrow(body.category, 'category');
	}

	if (body.event) {
		filter.event = body.event;
	}

	if (body.startDate || body.endDate) {
		const timestamp: NonNullable<LogFilter['timestamp']> = {};

		if (body.startDate) {
			timestamp.$gte = body.startDate;
		}

		if (body.endDate) {
			timestamp.$lte = body.endDate;
		}

		filter.timestamp = timestamp;
	}

	return filter;
}

function toLogDto(log: LeanLog): LogDto {
	return {
		id: log._id.toString(),
		timestamp: log.timestamp.toISOString(),
		event: log.event,
		user: toLogUserDto(log.user),
		product: toEntityDto(log.product),
		category: toEntityDto(log.category),
		details: log.details,
	};
}

function toLogUserDto(user: LeanLog['user']): LogDto['user'] {
	if (!user || user instanceof Types.ObjectId || !('email' in user)) {
		return {
			id: 'deleted',
			email: 'User deleted',
		};
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

function toObjectId(
	value: string | Types.ObjectId,
	fieldName: string,
): Types.ObjectId {
	return value instanceof Types.ObjectId
		? value
		: toObjectIdOrThrow(value, fieldName);
}

function toLogEntitySnapshot(
	entity: CreateLogInput['product'],
	fieldName: string,
): { id: Types.ObjectId; name: string } | undefined {
	if (!entity) {
		return undefined;
	}

	return {
		id: toObjectId(entity.id, fieldName),
		name: entity.name,
	};
}

function toEntityDto(entity: LeanLog['product']): LogDto['product'] {
	if (!entity) {
		return undefined;
	}

	return {
		id: entity.id.toString(),
		name: entity.name,
	};
}
