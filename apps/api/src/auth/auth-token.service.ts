import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import type { AuthTokenPayload } from './auth.types';

@Injectable()
export class AuthTokenService {
  sign(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
    const expiresInSeconds = this.getExpiresInSeconds();
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresInSeconds;
    const tokenPayload: AuthTokenPayload = { ...payload, iat, exp };

    const header = this.base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
    const payloadPart = this.base64UrlEncode(tokenPayload);
    const unsigned = `${header}.${payloadPart}`;
    const signature = this.computeSignature(unsigned);
    return `${unsigned}.${signature}`;
  }

  verify(token: string): AuthTokenPayload {
    const [header, payloadPart, signature] = token.split('.');
    if (!header || !payloadPart || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const unsigned = `${header}.${payloadPart}`;
    const expectedSignature = this.computeSignature(unsigned);
    const validSignature = this.constantTimeStringCompare(signature, expectedSignature);
    if (!validSignature) {
      throw new UnauthorizedException('Invalid token');
    }

    let payload: AuthTokenPayload;
    try {
      payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as AuthTokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid token payload');
    }

    if (!payload.sub || !payload.email || !payload.exp) {
      throw new UnauthorizedException('Invalid token payload');
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expired');
    }

    return payload;
  }

  private computeSignature(unsigned: string): string {
    return createHmac('sha256', this.getSecret()).update(unsigned).digest('base64url');
  }

  private getSecret(): string {
    return process.env.AUTH_TOKEN_SECRET ?? 'dev-only-change-me';
  }

  private getExpiresInSeconds(): number {
    const raw = process.env.AUTH_TOKEN_EXPIRES_IN_SECONDS;
    if (!raw) return 60 * 60 * 24 * 7;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return 60 * 60 * 24 * 7;
    return Math.floor(value);
  }

  private base64UrlEncode(value: unknown): string {
    return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
  }

  private constantTimeStringCompare(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);
    if (aBuffer.length !== bBuffer.length) return false;
    return timingSafeEqual(aBuffer, bBuffer);
  }
}
