import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Category } from '../categories/category.schema';

type ProductTimestamps = {
	createdAt: Date;
	updatedAt: Date;
};

export type ProductDocument = HydratedDocument<Product> & ProductTimestamps;

@Schema({ timestamps: true })
export class Product {
	@Prop({
		required: true,
		trim: true,
	})
	name!: string;

	@Prop({
		required: true,
		min: 0,
	})
	quantity!: number;

	@Prop({
		type: Types.ObjectId,
		ref: Category.name,
		required: true,
	})
	category!: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
