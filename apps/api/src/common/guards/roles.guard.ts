import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // No roles required — pass through (auth is handled separately by AuthGuard)
    if (!required || required.length === 0) return true;

    const { auth } = ctx.switchToHttp().getRequest<{
      auth?: { userId: string; role?: string };
    }>();

    if (!auth) return false;
    return required.some((role) => auth.role === role);
  }
}
