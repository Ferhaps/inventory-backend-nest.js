import { Types } from 'mongoose';

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

export type PopulatedUser = {
	_id: Types.ObjectId;
	email: string;
};

export type LeanLog = {
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

export type LogFilter = {
	user?: Types.ObjectId;
	'product.id'?: string;
	'category.id'?: string;
	event?: LogEvent;
	timestamp?: {
		$gte?: Date;
		$lte?: Date;
	};
};
