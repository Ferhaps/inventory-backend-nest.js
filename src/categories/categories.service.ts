import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogService } from '../log/log.service';
import { Product, ProductDocument } from '../products/product.schema';
import { Category, CategoryDocument } from './category.schema';

export type CategoryDto = {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
};

export type CreateCategoryInput = {
	name: string;
};

@Injectable()
export class CategoriesService {
	constructor(
		@InjectModel(Category.name)
		private readonly categoryModel: Model<CategoryDocument>,
		@InjectModel(Product.name)
		private readonly productModel: Model<ProductDocument>,
		private readonly logService: LogService,
	) {}

	async findAll(): Promise<CategoryDto[]> {
		const categories = await this.categoryModel
			.find()
			.sort({ createdAt: -1 })
			.exec();

		return categories.map(toCategoryDto);
	}

	async create(
		input: CreateCategoryInput,
		actorUserId: string,
	): Promise<CategoryDto> {
		const normalizedName = normalizeCategoryName(input.name);

		const existingCategory = await this.categoryModel
			.findOne({ name: normalizedName })
			.collation({ locale: 'en', strength: 2 })
			.exec();

		if (existingCategory) {
			throw new ConflictException('Category with this name already exists');
		}

		try {
			const category = await this.categoryModel.create({
				name: normalizedName,
			});

			await this.logService.create({
				event: 'CATEGORY_CREATE',
				user: actorUserId,
				category: {
					id: category._id,
					name: category.name,
				},
			});

			return toCategoryDto(category);
		} catch (error: unknown) {
			if (isDuplicateKeyError(error)) {
				throw new ConflictException('Category with this name already exists');
			}

			throw error;
		}
	}

	async remove(id: string, actorUserId: string): Promise<void> {
		const result = await this.categoryModel.findByIdAndDelete(id).exec();

		if (!result) {
			throw new NotFoundException(`Category with id ${id} not found`);
		}

		const products = await this.productModel
			.find({ category: result._id })
			.select('_id name')
			.exec();

		await this.productModel.deleteMany({ category: result._id }).exec();

		await Promise.all([
			this.logService.create({
				event: 'CATEGORY_DELETE',
				user: actorUserId,
				category: {
					id: result._id,
					name: result.name,
				},
			}),
			...products.map((product) =>
				this.logService.create({
					event: 'PRODUCT_DELETE',
					user: actorUserId,
					product: {
						id: product._id,
						name: product.name,
					},
				}),
			),
		]);
	}
}

function normalizeCategoryName(name: string): string {
	return name.trim();
}

function toCategoryDto(category: CategoryDocument): CategoryDto {
	return {
		id: category._id.toString(),
		name: category.name,
		createdAt: category.createdAt.toISOString(),
		updatedAt: category.updatedAt.toISOString(),
	};
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		error.code === 11000
	);
}
