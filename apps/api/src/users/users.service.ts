import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { BookingStatus, PaymentStatus, Prisma, UserRole } from '@prisma/client';
import type {
  DashboardStats,
  UpcomingBookingItem,
  User,
  UserNotificationPreferences,
} from '@vendorapp/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateClientOnboardingDto } from './dto/update-client-onboarding.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultNotificationPreferences: UserNotificationPreferences = {
    email: true,
    bookingUpdates: true,
    newMessages: true,
    marketing: false,
  };

  async getStats(userId: string): Promise<DashboardStats> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        artistProfile: {
          select: {
            id: true,
            averageRating: true,
            totalReviews: true,
            profileViews: true,
          },
        },
        ownedAgency: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }

    switch (user.role) {
      case UserRole.CLIENT: {
        const [totalBookings, upcomingBookings, spentAggregate, favouriteArtists] = await Promise.all([
          this.prisma.booking.count({
            where: { clientId: user.id },
          }),
          this.prisma.booking.count({
            where: {
              clientId: user.id,
              eventDate: {
                gte: new Date(),
              },
              status: {
                in: [
                  BookingStatus.PENDING,
                  BookingStatus.CONFIRMED,
                  BookingStatus.BOOKED,
                  BookingStatus.AWAITING_START_CODE,
                  BookingStatus.IN_PROGRESS,
                  BookingStatus.AWAITING_CLIENT_APPROVAL,
                ],
              },
            },
          }),
          this.prisma.booking.aggregate({
            where: {
              clientId: user.id,
              paymentStatus: PaymentStatus.PAID,
            },
            _sum: {
              totalAmount: true,
            },
          }),
          this.prisma.booking.findMany({
            where: { clientId: user.id },
            distinct: ['artistId'],
            select: { artistId: true },
          }),
        ]);

        return {
          role: 'CLIENT',
          totalBookings,
          upcomingBookings,
          totalSpent: Number(spentAggregate._sum.totalAmount?.toString() ?? '0'),
          favouriteArtists: favouriteArtists.length,
        };
      }
      case UserRole.ARTIST: {
        const artistProfile = user.artistProfile;
        if (!artistProfile) {
          return {
            role: 'ARTIST',
            totalBookings: 0,
            pendingBookings: 0,
            totalEarned: 0,
            averageRating: 0,
            totalReviews: 0,
            profileViews: 0,
          };
        }

        const [totalBookings, pendingBookings, earnedAggregate] = await Promise.all([
          this.prisma.booking.count({
            where: { artistId: artistProfile.id },
          }),
          this.prisma.booking.count({
            where: {
              artistId: artistProfile.id,
              status: BookingStatus.PENDING,
            },
          }),
          this.prisma.booking.aggregate({
            where: {
              artistId: artistProfile.id,
              paymentStatus: PaymentStatus.PAID,
            },
            _sum: {
              artistPayout: true,
            },
          }),
        ]);

        return {
          role: 'ARTIST',
          totalBookings,
          pendingBookings,
          totalEarned: Number(earnedAggregate._sum.artistPayout?.toString() ?? '0'),
          averageRating: artistProfile.averageRating,
          totalReviews: artistProfile.totalReviews,
          profileViews: artistProfile.profileViews,
        };
      }
      case UserRole.AGENCY: {
        const agencyId = user.ownedAgency?.id;
        if (!agencyId) {
          return {
            role: 'AGENCY',
            totalArtists: 0,
            activeBookings: 0,
            totalRevenue: 0,
          };
        }

        const [artists, activeBookings, revenueAggregate] = await Promise.all([
          this.prisma.booking.findMany({
            where: { agencyId },
            distinct: ['artistId'],
            select: { artistId: true },
          }),
          this.prisma.booking.count({
            where: {
              agencyId,
              status: {
                in: [
                  BookingStatus.PENDING,
                  BookingStatus.CONFIRMED,
                  BookingStatus.BOOKED,
                  BookingStatus.AWAITING_START_CODE,
                  BookingStatus.IN_PROGRESS,
                  BookingStatus.AWAITING_CLIENT_APPROVAL,
                ],
              },
            },
          }),
          this.prisma.booking.aggregate({
            where: { agencyId },
            _sum: {
              totalAmount: true,
            },
          }),
        ]);

        return {
          role: 'AGENCY',
          totalArtists: artists.length,
          activeBookings,
          totalRevenue: Number(revenueAggregate._sum.totalAmount?.toString() ?? '0'),
        };
      }
      case UserRole.SUB_ADMIN:
      case UserRole.ADMIN:
      default: {
        const [totalUsers, totalBookings, revenueAggregate] = await Promise.all([
          this.prisma.user.count(),
          this.prisma.booking.count(),
          this.prisma.booking.aggregate({
            _sum: {
              totalAmount: true,
            },
          }),
        ]);

        return {
          role: user.role,
          totalUsers,
          totalBookings,
          totalRevenue: Number(revenueAggregate._sum.totalAmount?.toString() ?? '0'),
        };
      }
    }
  }

  async getUpcomingBookings(userId: string): Promise<UpcomingBookingItem[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        artistProfile: { select: { id: true } },
        ownedAgency: { select: { id: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        ...this.buildAccessWhere(user),
        eventDate: {
          gte: new Date(),
        },
        status: {
          in: [
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.BOOKED,
            BookingStatus.AWAITING_START_CODE,
            BookingStatus.IN_PROGRESS,
            BookingStatus.AWAITING_CLIENT_APPROVAL,
          ],
        },
      },
      orderBy: [{ eventDate: 'asc' }, { createdAt: 'asc' }],
      take: 5,
      select: {
        id: true,
        title: true,
        eventDate: true,
        location: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        client: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
        artist: {
          select: {
            slug: true,
            displayName: true,
            user: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      title: booking.title,
      eventDate: booking.eventDate.toISOString(),
      location: booking.location,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      totalAmount: Number(booking.totalAmount.toString()),
      counterpartName:
        user.role === UserRole.CLIENT ? booking.artist.displayName : booking.client.fullName,
      counterpartAvatarUrl:
        user.role === UserRole.CLIENT
          ? booking.artist.user?.avatarUrl ?? null
          : booking.client.avatarUrl,
      artistSlug: booking.artist.slug,
    }));
  }

  async updateMe(userId: string, input: UpdateUserDto): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        role: true,
        accountType: true,
        avatarUrl: true,
        location: true,
        clientEventTypes: true,
        clientBudgetMin: true,
        clientBudgetMax: true,
        notificationPreferences: true,
        createdAt: true,
        isEmailVerified: true,
        isActive: true,
        onboardingCompletedAt: true,
      },
    });

    if (!existing) {
      throw new UnauthorizedException('User not found for token');
    }

    const notificationPreferences = this.mergeNotificationPreferences(
      this.toNotificationPreferences(existing.notificationPreferences),
      input.notificationPreferences,
    );

    const updated = await this.prisma.user.update({
      where: { id: existing.id },
      data: {
        ...(input.fullName !== undefined
          ? {
              fullName: input.fullName.trim(),
              name: input.fullName.trim(),
            }
          : {}),
        ...(input.location !== undefined
          ? {
              location: this.normalizeOptionalString(input.location),
            }
          : {}),
        ...(input.avatarUrl !== undefined
          ? {
              avatarUrl: this.normalizeOptionalString(input.avatarUrl),
            }
          : {}),
        notificationPreferences,
      },
    });

    return this.toPublicUser(updated);
  }

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
        notificationPreferences:
          this.defaultNotificationPreferences as unknown as Prisma.InputJsonObject,
      },
    });

    return this.toPublicUser(updated);
  }

  async deactivateMe(userId: string): Promise<{ success: true }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tokenVersion: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: false,
        tokenVersion: user.tokenVersion + 1,
      },
    });

    return { success: true };
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

  private buildAccessWhere(user: {
    id: string;
    role: UserRole;
    artistProfile?: { id: string } | null;
    ownedAgency?: { id: string } | null;
  }): Prisma.BookingWhereInput {
    switch (user.role) {
      case UserRole.CLIENT:
        return { clientId: user.id };
      case UserRole.ARTIST:
        return user.artistProfile?.id ? { artistId: user.artistProfile.id } : { id: '__no_bookings__' };
      case UserRole.AGENCY:
        return user.ownedAgency?.id ? { agencyId: user.ownedAgency.id } : { id: '__no_bookings__' };
      case UserRole.ADMIN:
      default:
        return {};
    }
  }

  private mergeNotificationPreferences(
    current: UserNotificationPreferences | null,
    updates: Partial<UserNotificationPreferences> | undefined,
  ): Prisma.JsonObject {
    const base = current ?? this.defaultNotificationPreferences;
    return {
      email: updates?.email ?? base.email,
      bookingUpdates: updates?.bookingUpdates ?? base.bookingUpdates,
      newMessages: updates?.newMessages ?? base.newMessages,
      marketing: updates?.marketing ?? base.marketing,
    };
  }

  private toNotificationPreferences(
    value: Prisma.JsonValue | null,
  ): UserNotificationPreferences | null {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    return {
      email: record.email !== false,
      bookingUpdates: record.bookingUpdates !== false,
      newMessages: record.newMessages !== false,
      marketing: record.marketing === true,
    };
  }

  private toPublicUser(user: {
    id: string;
    fullName: string;
    username: string;
    email: string;
    accountType: string;
    role: UserRole;
    avatarUrl: string | null;
    location: string | null;
    clientEventTypes: string[];
    clientBudgetMin: Prisma.Decimal | null;
    clientBudgetMax: Prisma.Decimal | null;
    notificationPreferences?: Prisma.JsonValue | null;
    createdAt: Date;
    isEmailVerified: boolean;
    isActive: boolean;
    onboardingCompletedAt?: Date | null;
  }): User {
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      accountType: user.accountType as User['accountType'],
      role: user.role,
      avatarUrl: user.avatarUrl,
      location: user.location,
      clientEventTypes: user.clientEventTypes,
      clientBudgetMin: user.clientBudgetMin ? Number(user.clientBudgetMin.toString()) : null,
      clientBudgetMax: user.clientBudgetMax ? Number(user.clientBudgetMax.toString()) : null,
      notificationPreferences:
        this.toNotificationPreferences(user.notificationPreferences ?? null) ??
        this.defaultNotificationPreferences,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      onboardingCompleted: Boolean(user.onboardingCompletedAt),
      createdAt: user.createdAt.toISOString(),
    };
  }
}
