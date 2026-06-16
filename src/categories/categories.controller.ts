import {
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
} from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { createCategoryQuerySchema } from './category.schemas';
import { CategoriesService, CategoryDto } from './categories.service';
import type { CreateCategoryQuery } from './category.schemas';

@Controller('/categories')
export class CategoriesController {
	constructor(private readonly categoriesService: CategoriesService) {}

	@Get()
	findAll(): Promise<CategoryDto[]> {
		return this.categoriesService.findAll();
	}

	@Post()
	create(
		@Query(new ZodValidationPipe(createCategoryQuerySchema))
		query: CreateCategoryQuery,
	): Promise<CategoryDto> {
		return this.categoriesService.create({ name: query.categoryName });
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@Roles(UserRole.ADMIN)
	remove(@Param('id') id: string): Promise<void> {
		return this.categoriesService.remove(id);
	}
}
