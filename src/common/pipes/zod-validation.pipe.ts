import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
	constructor(private readonly schema: ZodType<T>) {}

	transform(value: unknown): T {
		const result = this.schema.safeParse(value);

		if (!result.success) {
			throw new BadRequestException({
				message: result.error.issues.map((issue) => issue.message),
				error: 'Bad Request',
				statusCode: 400,
			});
		}

		return result.data;
	}
}
