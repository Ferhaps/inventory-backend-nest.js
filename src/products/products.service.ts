import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../categories/category.schema';
import { LogService } from '../log/log.service';
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
		private readonly logService: LogService,
	) {}

	async findAll(): Promise<ProductDto[]> {
		const products = await this.productModel
			.find()
			.sort({ createdAt: -1 })
			.exec();

		return products.map(toProductDto);
	}

	async create(
		input: CreateProductInput,
		actorUserId: string,
	): Promise<ProductDto> {
		const categoryObjectId = toObjectIdOrThrow(input.categoryId, 'categoryId');

		const category = await this.ensureCategoryExists(categoryObjectId);

		const product = await this.productModel.create({
			name: input.name.trim(),
			quantity: input.quantity,
			category: categoryObjectId,
		});

		await this.logService.create({
			event: 'PRODUCT_CREATE',
			user: actorUserId,
			product: {
				id: product._id,
				name: product.name,
			},
			category: {
				id: category._id,
				name: category.name,
			},
			details: `Initial quantity: ${product.quantity}`,
		});

		return toProductDto(product);
	}

	async updateQuantity(
		id: string,
		quantity: number,
		actorUserId: string,
	): Promise<ProductDto> {
		const productObjectId = toObjectIdOrThrow(id, 'id');

		const product = await this.productModel.findById(productObjectId).exec();

		if (!product) {
			throw new NotFoundException(`Product with id ${id} not found`);
		}

		const oldQuantity = product.quantity;
		product.quantity = quantity;
		await product.save();

		await this.logService.create({
			event: 'PRODUCT_UPDATE',
			user: actorUserId,
			product: {
				id: product._id,
				name: product.name,
			},
			details: `Quantity updated to ${product.quantity}, was ${oldQuantity}`,
		});

		return toProductDto(product);
	}

	async remove(id: string, actorUserId: string): Promise<void> {
		const productObjectId = toObjectIdOrThrow(id, 'id');

		const result = await this.productModel
			.findByIdAndDelete(productObjectId)
			.exec();

		if (!result) {
			throw new NotFoundException(`Product with id ${id} not found`);
		}

		await this.logService.create({
			event: 'PRODUCT_DELETE',
			user: actorUserId,
			product: {
				id: result._id,
				name: result.name,
			},
		});
	}

	private async ensureCategoryExists(
		categoryId: Types.ObjectId,
	): Promise<CategoryDocument> {
		const category = await this.categoryModel.findById(categoryId).exec();
		if (!category) {
			throw new NotFoundException(
				`Category with id ${categoryId.toString()} not found`,
			);
		}

		return category;
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
