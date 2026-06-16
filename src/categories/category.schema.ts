import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

type CategoryTimestamps = {
	createdAt: Date;
	updatedAt: Date;
};

export type CategoryDocument = HydratedDocument<Category> & CategoryTimestamps;

@Schema({ timestamps: true })
export class Category {
	@Prop({
		required: true,
		trim: true,
	})
	name!: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index(
	{ name: 1 },
	{
		unique: true,
		collation: { locale: 'en', strength: 2 },
	},
);
