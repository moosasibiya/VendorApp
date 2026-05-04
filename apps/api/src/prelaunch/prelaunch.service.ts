import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  PrelaunchInsiderStatus,
  PrelaunchLeadInterest,
} from '@prisma/client';
import { MailerService } from '../mailer/mailer.service';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { CreateInsiderDto } from './dto/create-insider.dto';
import { CreatePrelaunchLeadDto } from './dto/create-prelaunch-lead.dto';

type LeadContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class PrelaunchService {
  private readonly logger = new Logger(PrelaunchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimitService: RateLimitService,
    private readonly mailerService: MailerService,
  ) {}

  async createLead(input: CreatePrelaunchLeadDto, context?: LeadContext) {
    await this.enforceLeadRateLimit(context?.ipAddress);

    const email = input.email.trim();
    const emailNormalized = email.toLowerCase();
    const interestType = this.normalizeInterest(input.interestType);
    const source = input.source?.trim() || 'PRELAUNCH_PAGE';
    const firstName = input.name?.trim().split(/\s+/)[0] || 'INSIDER';
    const referralCode = await this.generateReferralCode(firstName);

    try {
      const lead = await this.prisma.prelaunchLead.upsert({
        where: { emailNormalized },
        update: {
          ...(input.name ? { name: input.name } : {}),
          interestType,
          source,
          ipAddress: context?.ipAddress ?? null,
          userAgent: context?.userAgent ?? null,
        },
        create: {
          email,
          emailNormalized,
          name: input.name ?? null,
          firstName: input.name?.trim().split(/\s+/)[0] ?? '',
          lastName: input.name?.trim().split(/\s+/).slice(1).join(' ') ?? '',
          phoneNumber: '',
          referralCode,
          interestType,
          source,
          ipAddress: context?.ipAddress ?? null,
          userAgent: context?.userAgent ?? null,
        },
      });

      return {
        id: lead.id,
        email: lead.email,
        interestType: lead.interestType,
        source: lead.source,
        createdAt: lead.createdAt.toISOString(),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.prisma.prelaunchLead.findUnique({
          where: { emailNormalized },
        });
        if (existing) {
          return {
            id: existing.id,
            email: existing.email,
            interestType: existing.interestType,
            source: existing.source,
            createdAt: existing.createdAt.toISOString(),
          };
        }
      }
      throw error;
    }
  }

  async createInsider(input: CreateInsiderDto, context?: LeadContext) {
    await this.enforceLeadRateLimit(context?.ipAddress);

    const email = input.email.trim().toLowerCase();
    const phoneNumber = input.phoneNumber.trim();
    if (!/^\+?[0-9][0-9\s().-]{6,30}$/.test(phoneNumber)) {
      throw new HttpException(
        'Please enter a valid phone number.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const referredBy = input.referredBy
      ? input.referredBy.trim().toUpperCase()
      : null;
    const referrer = referredBy
      ? await this.prisma.prelaunchLead.findUnique({
          where: { referralCode: referredBy },
        })
      : null;
    if (referredBy && !referrer) {
      throw new HttpException(
        'Referral code was not found.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (referrer?.emailNormalized === email) {
      throw new HttpException(
        'You cannot refer yourself.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.prisma.prelaunchLead.findUnique({
      where: { emailNormalized: email },
    });
    if (existing) {
      return this.toInsiderResponse(existing, true);
    }

    const referralCode = await this.generateReferralCode(input.firstName);
    const lead = await this.prisma.prelaunchLead.create({
      data: {
        email,
        emailNormalized: email,
        name: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phoneNumber,
        userType: input.userType,
        referralCode,
        referredBy: referredBy ?? null,
        interestType:
          input.userType === 'ARTIST'
            ? PrelaunchLeadInterest.CREATIVE
            : PrelaunchLeadInterest.CLIENT,
        source: 'INSIDER_PROGRAMME',
        ipAddress: context?.ipAddress ?? null,
        userAgent: context?.userAgent ?? null,
      },
    });

    void this.mailerService
      .sendInsiderWelcome(lead.email, {
        firstName: lead.firstName,
        userType: lead.userType,
      })
      .catch((error: unknown) => {
        this.logger.warn(
          JSON.stringify({
            type: 'insider_welcome_email_failed',
            insiderId: lead.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        );
      });

    return this.toInsiderResponse(lead, false);
  }

  async findReferral(code: string) {
    const referralCode = code.trim().toUpperCase();
    const lead = await this.prisma.prelaunchLead.findUnique({
      where: { referralCode },
      select: {
        firstName: true,
        userType: true,
        insiderStatus: true,
        referralCode: true,
      },
    });
    if (!lead) {
      return { valid: false, referralCode };
    }
    return {
      valid: true,
      referralCode: lead.referralCode,
      referrerFirstName: lead.firstName || 'An Insider',
      referrerType: lead.userType,
      referrerVerified: lead.insiderStatus === PrelaunchInsiderStatus.VERIFIED,
    };
  }

  private normalizeInterest(value: string | undefined): PrelaunchLeadInterest {
    if (
      value === PrelaunchLeadInterest.CREATIVE ||
      value === PrelaunchLeadInterest.CLIENT ||
      value === PrelaunchLeadInterest.AGENCY
    ) {
      return value;
    }
    return PrelaunchLeadInterest.GENERAL;
  }

  private async enforceLeadRateLimit(ipAddress?: string | null): Promise<void> {
    const decision = await this.rateLimitService.consume(
      `prelaunch-lead:${ipAddress?.trim() || 'unknown'}`,
      5,
      60,
    );

    if (decision.allowed) {
      return;
    }

    throw new HttpException(
      'Too many launch update requests. Please try again shortly.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private async generateReferralCode(firstName: string): Promise<string> {
    const prefix =
      (firstName || 'INSIDER')
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '')
        .slice(0, 16)
        .toUpperCase() || 'INSIDER';

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
      const code = `${prefix}-${suffix}`;
      const existing = await this.prisma.prelaunchLead.findUnique({
        where: { referralCode: code },
        select: { id: true },
      });
      if (!existing) return code;
    }

    return `${prefix}-${Date.now().toString(36).slice(-6).toUpperCase()}`;
  }

  private toInsiderResponse(
    lead: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      userType: string;
      referralCode: string;
      referredBy: string | null;
      insiderStatus: string;
      instagramFollowed: boolean;
      tiktokFollowed: boolean;
      referralCount: number;
      createdAt: Date;
      verifiedAt: Date | null;
    },
    duplicate: boolean,
  ) {
    return {
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phoneNumber: lead.phoneNumber,
      userType: lead.userType,
      referralCode: lead.referralCode,
      inviteLink: `${this.getWebOrigin()}/insider/${encodeURIComponent(lead.referralCode)}`,
      referredBy: lead.referredBy,
      insiderStatus: lead.insiderStatus,
      instagramFollowed: lead.instagramFollowed,
      tiktokFollowed: lead.tiktokFollowed,
      referralCount: lead.referralCount,
      createdAt: lead.createdAt.toISOString(),
      verifiedAt: lead.verifiedAt?.toISOString() ?? null,
      duplicate,
    };
  }

  private getWebOrigin(): string {
    return (
      process.env.WEB_ORIGIN?.split(',')[0]?.trim() ||
      process.env.NEXT_PUBLIC_WEB_URL?.trim() ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
  }
}
