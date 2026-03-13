import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Agency } from '@vendorapp/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAgencyDto } from './dto/create-agency.dto';

@Injectable()
export class AgenciesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyAgency(userId: string): Promise<Agency | null> {
    const agency = await this.prisma.agency.findUnique({
      where: { ownerId: userId },
    });

    return agency ? this.toAgency(agency) : null;
  }

  async createForOwner(userId: string, input: CreateAgencyDto): Promise<Agency> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        accountType: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }
    if (user.accountType !== 'AGENCY') {
      throw new ForbiddenException('Only agency accounts can complete agency onboarding');
    }

    const existingBySlug = await this.prisma.agency.findUnique({
      where: { slug: input.slug },
      select: {
        id: true,
        ownerId: true,
      },
    });
    if (existingBySlug && existingBySlug.ownerId !== user.id) {
      throw new ConflictException('Agency slug is already taken');
    }

    const [agency] = await this.prisma.$transaction([
      this.prisma.agency.upsert({
        where: { ownerId: user.id },
        update: {
          name: input.name.trim(),
          slug: input.slug.trim(),
          description: input.description.trim(),
          logoUrl: this.normalizeOptionalString(input.logoUrl),
          website: this.normalizeOptionalString(input.website),
          contactName: input.contactName.trim(),
          contactEmail: input.contactEmail.trim().toLowerCase(),
        },
        create: {
          ownerId: user.id,
          name: input.name.trim(),
          slug: input.slug.trim(),
          description: input.description.trim(),
          logoUrl: this.normalizeOptionalString(input.logoUrl),
          website: this.normalizeOptionalString(input.website),
          contactName: input.contactName.trim(),
          contactEmail: input.contactEmail.trim().toLowerCase(),
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          onboardingCompletedAt: new Date(),
        },
      }),
    ]);

    return this.toAgency(agency);
  }

  private normalizeOptionalString(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private toAgency(agency: {
    id: string;
    ownerId: string;
    name: string;
    slug: string;
    description: string;
    logoUrl: string | null;
    website: string | null;
    contactName: string | null;
    contactEmail: string | null;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Agency {
    return {
      id: agency.id,
      ownerId: agency.ownerId,
      name: agency.name,
      slug: agency.slug,
      description: agency.description,
      logoUrl: agency.logoUrl,
      website: agency.website,
      contactName: agency.contactName,
      contactEmail: agency.contactEmail,
      isVerified: agency.isVerified,
      createdAt: agency.createdAt.toISOString(),
      updatedAt: agency.updatedAt.toISOString(),
    };
  }
}
