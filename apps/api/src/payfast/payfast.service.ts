import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import type { ApiResponse, PaymentCheckoutSession } from '@vendorapp/shared';
import { createHash, timingSafeEqual } from 'crypto';
import { MailerService } from '../mailer/mailer.service';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { PayfastItnDto } from './dto/payfast-itn.dto';

type PaymentBookingRecord = Prisma.BookingGetPayload<{
  select: typeof paymentBookingSelect;
}>;

type RawPayfastBody = Record<string, string | string[] | undefined>;

const paymentBookingSelect = {
  id: true,
  clientId: true,
  artistId: true,
  title: true,
  description: true,
  status: true,
  paymentProvider: true,
  paymentStatus: true,
  paymentReference: true,
  paymentGatewayReference: true,
  paymentInitiatedAt: true,
  paymentPaidAt: true,
  paymentFailedAt: true,
  totalAmount: true,
  platformFee: true,
  artistPayout: true,
  eventDate: true,
  location: true,
  client: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  },
  artist: {
    select: {
      id: true,
      userId: true,
      displayName: true,
      slug: true,
      user: {
        select: {
          email: true,
          fullName: true,
        },
      },
    },
  },
  agency: {
    select: {
      id: true,
      ownerId: true,
      name: true,
    },
  },
} satisfies Prisma.BookingSelect;

@Injectable()
export class PayfastService {
  private readonly logger = new Logger(PayfastService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimitService: RateLimitService,
    private readonly mailerService: MailerService,
  ) {}

  async initiateBookingPayment(
    userId: string,
    bookingId: string,
  ): Promise<ApiResponse<PaymentCheckoutSession>> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: paymentBookingSelect,
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.clientId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only the booking client can initiate payment');
      }
    }
    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('Only confirmed bookings can be paid');
    }
    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('This booking has already been paid');
    }
    if (booking.paymentStatus === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Refunded bookings cannot be repaid');
    }

    const reference = booking.paymentReference ?? this.buildPaymentReference(booking.id);
    const initiatedAt = new Date();
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentProvider: PaymentProvider.PAYFAST,
        paymentReference: reference,
        paymentInitiatedAt: initiatedAt,
        paymentFailedAt: booking.paymentStatus === PaymentStatus.FAILED ? null : booking.paymentFailedAt,
      },
    });

    const formFields = this.buildCheckoutFields({
      bookingId: booking.id,
      reference,
      amount: this.decimalToCurrency(booking.totalAmount),
      title: booking.title,
      description: booking.description,
      clientName: booking.client.fullName,
      clientEmail: booking.client.email,
    });

    return {
      data: {
        bookingId: booking.id,
        provider: PaymentProvider.PAYFAST,
        method: 'POST',
        gatewayUrl: this.getGatewayUrl(),
        formFields,
      },
    };
  }

  async handleNotification(
    payload: PayfastItnDto,
    rawBody: RawPayfastBody,
    ipAddress?: string | null,
  ): Promise<void> {
    await this.enforceWebhookRateLimit(payload.m_payment_id, ipAddress);
    this.assertPayfastConfigured();

    if (payload.merchant_id !== this.getMerchantId()) {
      throw new BadRequestException('Invalid merchant identifier');
    }

    const signature = this.computeSignature(rawBody);
    if (!this.constantTimeEquals(signature, payload.signature)) {
      throw new BadRequestException('Invalid Payfast signature');
    }

    const booking = await this.prisma.booking.findFirst({
      where: {
        OR: [{ paymentReference: payload.m_payment_id }, { id: payload.m_payment_id }],
      },
      select: paymentBookingSelect,
    });
    if (!booking) {
      throw new NotFoundException('Booking payment reference not found');
    }

    const expectedAmount = this.decimalToCurrency(booking.totalAmount);
    if (expectedAmount !== this.normalizeCurrency(payload.amount_gross)) {
      throw new BadRequestException('Notification amount does not match booking total');
    }

    const normalizedStatus = payload.payment_status.trim().toUpperCase();
    if (normalizedStatus === 'COMPLETE') {
      await this.markPaymentPaid(booking, payload);
      return;
    }

    if (normalizedStatus === 'FAILED' || normalizedStatus === 'CANCELLED') {
      await this.markPaymentFailed(booking, payload);
      return;
    }

    this.logger.log(
      JSON.stringify({
        type: 'payfast_notification_ignored',
        bookingId: booking.id,
        paymentStatus: normalizedStatus,
        pfPaymentId: payload.pf_payment_id ?? null,
      }),
    );
  }

  private async markPaymentPaid(booking: PaymentBookingRecord, payload: PayfastItnDto): Promise<void> {
    if (booking.paymentStatus === PaymentStatus.PAID) {
      return;
    }

    const paidAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentProvider: PaymentProvider.PAYFAST,
          paymentStatus: PaymentStatus.PAID,
          paymentReference: booking.paymentReference ?? payload.m_payment_id,
          paymentGatewayReference: payload.pf_payment_id ?? booking.paymentGatewayReference,
          paymentPaidAt: paidAt,
          paymentFailedAt: null,
        },
      });

      const recipients = this.getPaymentNotificationRecipients(booking);
      await tx.notification.createMany({
        data: recipients.map((userId) => ({
          userId,
          type: NotificationType.PAYMENT_RECEIVED,
          title: 'Payment received',
          body: `Payment was received for "${booking.title}".`,
          metadata: {
            bookingId: booking.id,
            paymentStatus: PaymentStatus.PAID,
            provider: PaymentProvider.PAYFAST,
          },
        })),
      });
    });

    await Promise.all([
      this.mailerService.sendBookingConfirmation(booking.client.email, {
        recipientEmail: booking.client.email,
        recipientName: booking.client.fullName,
        counterpartName: booking.artist.displayName,
        title: booking.title,
        eventDate: booking.eventDate.toISOString(),
        location: booking.location,
      }),
      booking.artist.user?.email
        ? this.mailerService.sendBookingConfirmation(booking.artist.user.email, {
            recipientEmail: booking.artist.user.email,
            recipientName: booking.artist.user.fullName,
            counterpartName: booking.client.fullName,
            title: booking.title,
            eventDate: booking.eventDate.toISOString(),
            location: booking.location,
          })
        : Promise.resolve(),
    ]);

    this.logger.log(
      JSON.stringify({
        type: 'payfast_payment_paid',
        bookingId: booking.id,
        reference: booking.paymentReference ?? payload.m_payment_id,
        pfPaymentId: payload.pf_payment_id ?? null,
      }),
    );
  }

  private async markPaymentFailed(booking: PaymentBookingRecord, payload: PayfastItnDto): Promise<void> {
    if (booking.paymentStatus === PaymentStatus.PAID) {
      return;
    }

    const failedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          paymentProvider: PaymentProvider.PAYFAST,
          paymentStatus: PaymentStatus.FAILED,
          paymentReference: booking.paymentReference ?? payload.m_payment_id,
          paymentGatewayReference: payload.pf_payment_id ?? booking.paymentGatewayReference,
          paymentFailedAt: failedAt,
        },
      });

      await tx.notification.create({
        data: {
          userId: booking.clientId,
          type: NotificationType.PAYMENT_FAILED,
          title: 'Payment failed',
          body: `Payment failed for "${booking.title}". Try the Payfast checkout again.`,
          metadata: {
            bookingId: booking.id,
            paymentStatus: PaymentStatus.FAILED,
            provider: PaymentProvider.PAYFAST,
          },
        },
      });
    });

    this.logger.warn(
      JSON.stringify({
        type: 'payfast_payment_failed',
        bookingId: booking.id,
        reference: booking.paymentReference ?? payload.m_payment_id,
        pfPaymentId: payload.pf_payment_id ?? null,
        status: payload.payment_status,
      }),
    );
  }

  private buildCheckoutFields(input: {
    bookingId: string;
    reference: string;
    amount: string;
    title: string;
    description: string;
    clientName: string;
    clientEmail: string;
  }): Record<string, string> {
    const [nameFirst, ...rest] = input.clientName.trim().split(/\s+/);
    const nameLast = rest.join(' ').trim();
    const fields: Record<string, string> = {
      merchant_id: this.getMerchantId(),
      merchant_key: this.getMerchantKey(),
      return_url: this.getReturnUrl(input.bookingId),
      cancel_url: this.getCancelUrl(input.bookingId),
      notify_url: this.getNotifyUrl(),
      name_first: nameFirst || 'VendorApp',
      name_last: nameLast || 'Customer',
      email_address: input.clientEmail,
      m_payment_id: input.reference,
      amount: input.amount,
      item_name: input.title.slice(0, 100),
      item_description: input.description.slice(0, 255),
      custom_str1: input.bookingId,
    };

    fields.signature = this.computeSignature(fields);
    return fields;
  }

  private getPaymentNotificationRecipients(booking: PaymentBookingRecord): string[] {
    const recipients = new Set<string>([booking.clientId]);
    if (booking.artist.userId) {
      recipients.add(booking.artist.userId);
    }
    if (booking.agency?.ownerId) {
      recipients.add(booking.agency.ownerId);
    }
    return Array.from(recipients);
  }

  private getGatewayUrl(): string {
    return this.isSandbox()
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';
  }

  private getReturnUrl(bookingId: string): string {
    const origin = this.getWebOrigin();
    return `${origin}/bookings/${bookingId}?payment=returned`;
  }

  private getCancelUrl(bookingId: string): string {
    const origin = this.getWebOrigin();
    return `${origin}/bookings/${bookingId}?payment=cancelled`;
  }

  private getNotifyUrl(): string {
    const explicit = process.env.PAYFAST_NOTIFY_URL?.trim();
    if (explicit) {
      return explicit;
    }
    const apiOrigin = process.env.API_PUBLIC_URL?.trim() || `http://localhost:${process.env.API_PORT ?? '4000'}`;
    return `${apiOrigin.replace(/\/+$/, '')}/api/payfast/notify`;
  }

  private getWebOrigin(): string {
    return (process.env.WEB_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:3000').replace(
      /\/+$/,
      '',
    );
  }

  private getMerchantId(): string {
    const value = process.env.PAYFAST_MERCHANT_ID?.trim();
    if (!value) {
      throw new InternalServerErrorException('Payments are currently unavailable');
    }
    return value;
  }

  private getMerchantKey(): string {
    const value = process.env.PAYFAST_MERCHANT_KEY?.trim();
    if (!value) {
      throw new InternalServerErrorException('Payments are currently unavailable');
    }
    return value;
  }

  private getPassphrase(): string | null {
    const value = process.env.PAYFAST_PASSPHRASE?.trim();
    return value ? value : null;
  }

  private isSandbox(): boolean {
    return process.env.PAYFAST_SANDBOX?.trim() !== 'false';
  }

  private assertPayfastConfigured(): void {
    if (!process.env.PAYFAST_MERCHANT_ID?.trim() || !process.env.PAYFAST_MERCHANT_KEY?.trim()) {
      throw new InternalServerErrorException('Payments are currently unavailable');
    }
  }

  private computeSignature(payload: RawPayfastBody | Record<string, string>): string {
    const entries = Object.entries(payload)
      .filter(([key]) => key !== 'signature')
      .map(([key, value]) => [key, this.normalizePayloadValue(value)] as const)
      .filter(([, value]) => value.length > 0);

    const parameterString = entries
      .map(([key, value]) => `${key}=${this.payfastEncode(value)}`)
      .join('&');

    const withPassphrase = this.getPassphrase()
      ? `${parameterString}&passphrase=${this.payfastEncode(this.getPassphrase() ?? '')}`
      : parameterString;

    return createHash('md5').update(withPassphrase).digest('hex');
  }

  private normalizePayloadValue(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
      return value[0]?.trim() ?? '';
    }
    return value?.trim() ?? '';
  }

  private payfastEncode(value: string): string {
    return encodeURIComponent(value).replace(/%20/g, '+');
  }

  private decimalToCurrency(value: Prisma.Decimal): string {
    return Number(value.toString()).toFixed(2);
  }

  private normalizeCurrency(value: string): string {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException('Notification amount is invalid');
    }
    return parsed.toFixed(2);
  }

  private buildPaymentReference(bookingId: string): string {
    return bookingId;
  }

  private constantTimeEquals(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    if (left.length !== right.length) {
      return false;
    }
    return timingSafeEqual(left, right);
  }

  private async enforceWebhookRateLimit(paymentReference: string, ipAddress?: string | null): Promise<void> {
    const key = `payfast-itn:${ipAddress ?? 'unknown'}:${paymentReference}`;
    const decision = await this.rateLimitService.consume(key, 60, 60);
    if (!decision.allowed) {
      throw new BadRequestException('Too many Payfast notifications');
    }
  }
}
