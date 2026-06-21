import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from './user-role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
	@Prop({
		required: true,
		unique: true,
		trim: true,
		lowercase: true,
	})
	email!: string;

	@Prop({ required: true, select: false })
	password!: string;

	@Prop({
		type: String,
		required: true,
		enum: Object.values(UserRole),
	})
	role!: UserRole;

	createdAt!: Date;
	updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
