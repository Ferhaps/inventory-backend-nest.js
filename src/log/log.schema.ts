import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../users/user.schema';

export const LOG_EVENTS = [
	'CATEGORY_CREATE',
	'CATEGORY_DELETE',
	'PRODUCT_CREATE',
	'PRODUCT_DELETE',
	'PRODUCT_UPDATE',
	'USER_DELETE',
	'USER_LOGIN',
	'USER_REGISTER',
] as const;

export type LogEvent = (typeof LOG_EVENTS)[number];

export type LogDocument = HydratedDocument<Log>;

@Schema({ _id: false })
export class LogEntitySnapshot {
	@Prop({
		required: true,
		trim: true,
	})
	id!: string;

	@Prop({
		required: true,
		trim: true,
	})
	name!: string;
}

const LogEntitySnapshotSchema = SchemaFactory.createForClass(LogEntitySnapshot);

@Schema()
export class Log {
	@Prop({
		type: String,
		required: true,
		enum: LOG_EVENTS,
	})
	event!: LogEvent;

	@Prop({
		type: Date,
		required: true,
		default: Date.now,
	})
	timestamp!: Date;

	@Prop({
		type: Types.ObjectId,
		ref: User.name,
		required: true,
	})
	user!: Types.ObjectId;

	@Prop({ type: LogEntitySnapshotSchema })
	product?: LogEntitySnapshot;

	@Prop({ type: LogEntitySnapshotSchema })
	category?: LogEntitySnapshot;

	@Prop({
		trim: true,
	})
	details?: string;
}

export const LogSchema = SchemaFactory.createForClass(Log);

LogSchema.index({ timestamp: -1 });
LogSchema.index({ user: 1, timestamp: -1 });
LogSchema.index({ event: 1, timestamp: -1 });
LogSchema.index({ 'product.id': 1, timestamp: -1 });
LogSchema.index({ 'category.id': 1, timestamp: -1 });
