import { z } from 'zod';

export const createProductBodySchema = z.object({
	name: z.string().trim().min(1, 'Product name is required'),
	categoryId: z.string().trim().min(1, 'Category id is required'),
	quantity: z.coerce
		.number({ message: 'Quantity must be a valid number' })
		.gte(0, 'Quantity must be greater than or equal to 0'),
});

export const updateProductQuantityQuerySchema = z.object({
	quantity: z.coerce
		.number({ message: 'Quantity must be a valid number' })
		.gte(0, 'Quantity must be greater than or equal to 0'),
});

export type CreateProductBody = z.infer<typeof createProductBodySchema>;
export type UpdateProductQuantityQuery = z.infer<
	typeof updateProductQuantityQuerySchema
>;
