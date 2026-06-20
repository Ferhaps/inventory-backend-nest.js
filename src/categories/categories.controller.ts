import {
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
	Req,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/jwt.strategy';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { createCategoryQuerySchema } from './category.schemas';
import { CategoriesService, CategoryDto } from './categories.service';
import type { CreateCategoryQuery } from './category.schemas';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('/categories')
@ApiTags('Categories')
@ApiBearerAuth('bearer')
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
		@Req() request: AuthenticatedRequest,
	): Promise<CategoryDto> {
		return this.categoriesService.create(
			{ name: query.categoryName },
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
		return this.categoriesService.remove(id, request.user.sub);
	}
}
