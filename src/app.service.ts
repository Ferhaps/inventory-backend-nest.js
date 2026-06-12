import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AppService {
	constructor(private readonly jwtService: JwtService) {}

	getHello(): string {
		return 'Hello World!';
	}

	createToken(): { accessToken: string } {
		return {
			accessToken: this.jwtService.sign({ sub: 'test-user' }),
		};
	}
}
