import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
	createProductBodySchema,
	updateProductQuantityQuerySchema,
} from './product.schemas';
import type {
	CreateProductBody,
	UpdateProductQuantityQuery,
} from './product.schemas';
import { ProductsService } from './products.service';
import type { ProductDto } from './products.service';

@Controller('/products')
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@Get()
	findAll(): Promise<ProductDto[]> {
		return this.productsService.findAll();
	}

	@Post()
	create(
		@Body(new ZodValidationPipe(createProductBodySchema))
		body: CreateProductBody,
	): Promise<ProductDto> {
		return this.productsService.create(body);
	}

	@Patch(':id')
	updateQuantity(
		@Param('id') id: string,
		@Query(new ZodValidationPipe(updateProductQuantityQuerySchema))
		query: UpdateProductQuantityQuery,
	): Promise<ProductDto> {
		return this.productsService.updateQuantity(id, query.quantity);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@Roles(UserRole.ADMIN)
	remove(@Param('id') id: string): Promise<void> {
		return this.productsService.remove(id);
	}
}
