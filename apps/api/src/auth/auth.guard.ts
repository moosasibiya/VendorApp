import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';

type RequestWithAuth = {
  headers: {
    authorization?: string;
  };
  auth?: {
    userId: string;
    email: string;
  };
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: AuthTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const payload = this.tokenService.verify(token);
    request.auth = {
      userId: payload.sub,
      email: payload.email,
    };

    return true;
  }
}
