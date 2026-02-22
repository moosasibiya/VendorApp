import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuthAuditInput = {
  eventType: string;
  success: boolean;
  userId?: string | null;
  emailNormalized?: string | null;
  ipAddress?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuthAuditService {
  private readonly logger = new Logger(AuthAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuthAuditInput): Promise<void> {
    const payload = {
      eventType: input.eventType,
      success: input.success,
      userId: input.userId ?? null,
      emailNormalized: input.emailNormalized ?? null,
      ipAddress: input.ipAddress ?? null,
      requestId: input.requestId ?? null,
      metadata: input.metadata ?? {},
    };

    this.logger.log(JSON.stringify({ type: 'auth_audit', ...payload }));

    try {
      await this.prisma.authAuditEvent.create({
        data: {
          id: randomBytes(12).toString('hex'),
          eventType: input.eventType,
          success: input.success,
          userId: input.userId ?? null,
          emailNormalized: input.emailNormalized ?? null,
          ipAddress: input.ipAddress ?? null,
          requestId: input.requestId ?? null,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to persist auth audit event ${input.eventType}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
