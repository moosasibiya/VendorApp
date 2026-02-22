import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';
import { UsersStore } from './users.store';

type RequestWithAuth = {
  headers: {
    authorization?: string;
    cookie?: string;
  };
  auth?: {
    userId: string;
    email: string;
  };
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: AuthTokenService,
    private readonly usersStore: UsersStore,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const token = this.getTokenFromRequest(request.headers);
    if (!token) throw new UnauthorizedException('Missing auth token');

    const payload = this.tokenService.verify(token);
    const user = await this.usersStore.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token user');
    }
    const tokenVersion =
      Number.isInteger(user.tokenVersion) &&
      user.tokenVersion !== undefined &&
      user.tokenVersion >= 0
        ? user.tokenVersion
        : 0;
    if (tokenVersion !== payload.ver) {
      throw new UnauthorizedException('Token revoked');
    }

    request.auth = {
      userId: payload.sub,
      email: payload.email,
    };

    return true;
  }

  private getTokenFromRequest(headers: RequestWithAuth['headers']): string | null {
    const bearerToken = this.getBearerToken(headers.authorization);
    if (bearerToken) return bearerToken;
    return this.getCookieToken(headers.cookie);
  }

  private getBearerToken(authorization?: string): string | null {
    if (!authorization) return null;
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    return token;
  }

  private getCookieToken(cookieHeader?: string): string | null {
    if (!cookieHeader) return null;
    const cookieName = process.env.AUTH_COOKIE_NAME?.trim() || 'vendrman_auth';
    const cookies = cookieHeader.split(';');
    for (const chunk of cookies) {
      const [rawName, ...rawValueParts] = chunk.trim().split('=');
      if (!rawName || rawValueParts.length === 0) continue;
      if (rawName !== cookieName) continue;
      return decodeURIComponent(rawValueParts.join('='));
    }
    return null;
  }
}
