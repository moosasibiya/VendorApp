import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@vendorapp/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ALLOW_INCOMPLETE_ONBOARDING_KEY } from './allow-incomplete-onboarding.decorator';
import { UsersStore } from './users.store';

type RequestWithAuth = {
  method?: string;
  auth?: {
    userId: string;
  };
};

@Injectable()
export class OnboardingCompleteGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersStore: UsersStore,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowIncomplete = this.reflector.getAllAndOverride<boolean>(
      ALLOW_INCOMPLETE_ONBOARDING_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowIncomplete) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    if (this.isSafeHttpMethod(request.method)) {
      return true;
    }

    const userId = request.auth?.userId;
    if (!userId) {
      return true;
    }

    const user = await this.usersStore.findById(userId);
    if (!user) {
      return true;
    }

    if (await this.isOnboardingComplete(user.id, user.role, user.onboardingCompletedAt ?? null)) {
      return true;
    }

    throw new ForbiddenException(
      'Complete onboarding before editing anything outside the onboarding flow.',
    );
  }

  private isSafeHttpMethod(method: string | undefined): boolean {
    return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
  }

  private async isOnboardingComplete(
    userId: string,
    role: string,
    onboardingCompletedAt: string | null,
  ): Promise<boolean> {
    if (onboardingCompletedAt) {
      return true;
    }

    switch (role) {
      case UserRole.ARTIST: {
        const artistProfile = await this.prisma.artist.findFirst({
          where: { userId },
          select: { onboardingCompleted: true },
        });
        return Boolean(artistProfile?.onboardingCompleted);
      }
      case UserRole.AGENCY: {
        const agency = await this.prisma.agency.findUnique({
          where: { ownerId: userId },
          select: { id: true },
        });
        return Boolean(agency);
      }
      case UserRole.ADMIN:
        return true;
      case UserRole.CLIENT:
      default:
        return false;
    }
  }
}
