import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../categories/category.schema';
import { Product, ProductDocument } from './product.schema';

export type ProductDto = {
	id: string;
	name: string;
	quantity: number;
	categoryId: string;
	createdAt: string;
	updatedAt: string;
};

export type CreateProductInput = {
	name: string;
	quantity: number;
	categoryId: string;
};

@Injectable()
export class ProductsService {
	constructor(
		@InjectModel(Product.name)
		private readonly productModel: Model<ProductDocument>,
		@InjectModel(Category.name)
		private readonly categoryModel: Model<CategoryDocument>,
	) {}

	async findAll(): Promise<ProductDto[]> {
		const products = await this.productModel
			.find()
			.sort({ createdAt: -1 })
			.exec();

		return products.map(toProductDto);
	}

	async create(input: CreateProductInput): Promise<ProductDto> {
		const categoryObjectId = toObjectIdOrThrow(input.categoryId, 'categoryId');

		await this.ensureCategoryExists(categoryObjectId);

		const product = await this.productModel.create({
			name: input.name.trim(),
			quantity: input.quantity,
			category: categoryObjectId,
		});

		return toProductDto(product);
	}

	async updateQuantity(id: string, quantity: number): Promise<ProductDto> {
		const productObjectId = toObjectIdOrThrow(id, 'id');

		const product = await this.productModel
			.findByIdAndUpdate(
				productObjectId,
				{ quantity },
				{ returnDocument: 'after', runValidators: true },
			)
			.exec();

		if (!product) {
			throw new NotFoundException(`Product with id ${id} not found`);
		}

		return toProductDto(product);
	}

	async remove(id: string): Promise<void> {
		const productObjectId = toObjectIdOrThrow(id, 'id');

		const result = await this.productModel
			.findByIdAndDelete(productObjectId)
			.exec();

		if (!result) {
			throw new NotFoundException(`Product with id ${id} not found`);
		}
	}

	private async ensureCategoryExists(
		categoryId: Types.ObjectId,
	): Promise<void> {
		const category = await this.categoryModel.findById(categoryId).exec();
		if (!category) {
			throw new NotFoundException(
				`Category with id ${categoryId.toString()} not found`,
			);
		}
	}
}

function toProductDto(product: ProductDocument): ProductDto {
	return {
		id: product._id.toString(),
		name: product.name,
		quantity: product.quantity,
		categoryId: product.category.toString(),
		createdAt: product.createdAt.toISOString(),
		updatedAt: product.updatedAt.toISOString(),
	};
}

function toObjectIdOrThrow(value: string, fieldName: string): Types.ObjectId {
	if (!Types.ObjectId.isValid(value)) {
		throw new BadRequestException(`${fieldName} must be a valid Mongo id`);
	}

	return new Types.ObjectId(value);
}
