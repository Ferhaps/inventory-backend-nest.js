import { z } from 'zod';

export const createCategoryQuerySchema = z.object({
	categoryName: z.string().trim().min(1, 'Category name is required'),
});

export type CreateCategoryQuery = z.infer<typeof createCategoryQuerySchema>;
