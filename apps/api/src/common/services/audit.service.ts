import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logBookingEvent(params: {
    bookingId: string;
    actorId: string | null;
    action: string;
    message?: string;
    meta?: Record<string, unknown>;
    tx?: TransactionClient;
  }): Promise<void> {
    const db = params.tx ?? this.prisma;
    await db.bookingAuditEvent
      .create({
        data: {
          bookingId: params.bookingId,
          actorUserId: params.actorId,
          eventType: params.action,
          message: params.message ?? params.action,
          metadata: params.meta
            ? (params.meta as Prisma.InputJsonValue)
            : undefined,
        },
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Booking audit log failed for ${params.bookingId}: ${message}`);
      });
  }

  async logAuthEvent(params: {
    userId?: string | null;
    emailNormalized?: string | null;
    action: string;
    ip?: string | null;
    success: boolean;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.authAuditEvent
      .create({
        data: {
          id: randomBytes(12).toString('hex'),
          eventType: params.action,
          success: params.success,
          userId: params.userId ?? null,
          emailNormalized: params.emailNormalized ?? null,
          ipAddress: params.ip ?? null,
          metadata: (params.meta ?? {}) as Prisma.InputJsonValue,
        },
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Auth audit log failed: ${message}`);
      });
  }
}
