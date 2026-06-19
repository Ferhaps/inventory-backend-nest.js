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
	Req,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/jwt.strategy';
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
		@Req() request: AuthenticatedRequest,
	): Promise<ProductDto> {
		return this.productsService.create(body, request.user.sub);
	}

	@Patch(':id')
	updateQuantity(
		@Param('id') id: string,
		@Query(new ZodValidationPipe(updateProductQuantityQuerySchema))
		query: UpdateProductQuantityQuery,
		@Req() request: AuthenticatedRequest,
	): Promise<ProductDto> {
		return this.productsService.updateQuantity(
			id,
			query.quantity,
			request.user.sub,
		);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@Roles(UserRole.ADMIN)
	remove(
		@Param('id') id: string,
		@Req() request: AuthenticatedRequest,
	): Promise<void> {
		return this.productsService.remove(id, request.user.sub);
	}
}
