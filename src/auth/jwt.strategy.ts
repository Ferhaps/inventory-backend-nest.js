import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvironmentVariables } from '../config/environment';
import { UserRole } from '../users/user-role.enum';

export type JwtPayload = {
	sub: string;
	email: string;
	role: UserRole;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(configService: ConfigService<EnvironmentVariables, true>) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: true,
			secretOrKey: configService.get('JWT_SECRET', { infer: true }),
		});
	}

	validate(payload: JwtPayload): JwtPayload {
		return payload;
	}
}
