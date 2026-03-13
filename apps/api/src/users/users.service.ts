import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { User } from '@vendorapp/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateClientOnboardingDto } from './dto/update-client-onboarding.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateClientOnboarding(userId: string, input: UpdateClientOnboardingDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        accountType: true,
        role: true,
        createdAt: true,
        isEmailVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }
    if (user.accountType !== 'CLIENT') {
      throw new ForbiddenException('Only client accounts can complete client onboarding');
    }
    if (
      input.budgetMin !== null &&
      input.budgetMin !== undefined &&
      input.budgetMax !== null &&
      input.budgetMax !== undefined &&
      input.budgetMin > input.budgetMax
    ) {
      throw new BadRequestException('budgetMin cannot be greater than budgetMax');
    }

    const eventTypes = this.uniqueValues(input.eventTypes);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: input.fullName.trim(),
        name: input.fullName.trim(),
        avatarUrl: this.normalizeOptionalString(input.avatarUrl),
        location: input.location.trim(),
        clientEventTypes: eventTypes,
        clientBudgetMin:
          input.budgetMin === null || input.budgetMin === undefined
            ? null
            : input.budgetMin.toFixed(2),
        clientBudgetMax:
          input.budgetMax === null || input.budgetMax === undefined
            ? null
            : input.budgetMax.toFixed(2),
        onboardingCompletedAt: new Date(),
        notificationPreferences: {
          email: true,
        },
      },
    });

    return {
      id: updated.id,
      fullName: updated.fullName,
      username: updated.username,
      email: updated.email,
      accountType: updated.accountType,
      role: updated.role,
      avatarUrl: updated.avatarUrl,
      location: updated.location,
      clientEventTypes: updated.clientEventTypes,
      clientBudgetMin: updated.clientBudgetMin ? Number(updated.clientBudgetMin) : null,
      clientBudgetMax: updated.clientBudgetMax ? Number(updated.clientBudgetMax) : null,
      isEmailVerified: updated.isEmailVerified,
      isActive: updated.isActive,
      onboardingCompleted: true,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  private uniqueValues(values: string[]): string[] {
    const seen = new Set<string>();
    const output: string[] = [];
    for (const raw of values) {
      const value = raw.trim();
      if (!value) {
        continue;
      }
      const key = value.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      output.push(value);
    }
    return output;
  }

  private normalizeOptionalString(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
