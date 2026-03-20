import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

type BookingEmailInput = {
  recipientEmail: string;
  recipientName?: string | null;
  counterpartName: string;
  title: string;
  eventDate: string;
  location: string;
};

type BookingStartCodeEmailInput = {
  recipientEmail: string;
  recipientName?: string | null;
  title: string;
  eventDate: string;
  location: string;
  verificationCode: string;
};

type ArtistApprovedLiveEmailInput = {
  recipientName?: string | null;
  artistName: string;
};

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const resetUrl = `${this.getWebOrigin()}/reset-password?token=${encodeURIComponent(token)}`;

    await this.sendEmail({
      to,
      subject: 'Reset your VendorApp password',
      text: [
        'You requested a password reset for your VendorApp account.',
        `Reset your password: ${resetUrl}`,
        'This link expires in 1 hour.',
      ].join('\n\n'),
      html: [
        '<p>You requested a password reset for your VendorApp account.</p>',
        `<p><a href="${resetUrl}">Reset your password</a></p>`,
        '<p>This link expires in 1 hour.</p>',
      ].join(''),
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${this.getApiBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}&redirect=1`;

    await this.sendEmail({
      to,
      subject: 'Verify your VendorApp email',
      text: [
        'Welcome to VendorApp.',
        `Verify your email: ${verifyUrl}`,
        'This link expires in 24 hours.',
      ].join('\n\n'),
      html: [
        '<p>Welcome to VendorApp.</p>',
        `<p><a href="${verifyUrl}">Verify your email</a></p>`,
        '<p>This link expires in 24 hours.</p>',
      ].join(''),
    });
  }

  async sendBookingConfirmation(to: string, booking: BookingEmailInput): Promise<void> {
    const greeting = booking.recipientName ? `Hi ${booking.recipientName},` : 'Hello,';
    await this.sendEmail({
      to,
      subject: `Booking confirmed: ${booking.title}`,
      text: [
        greeting,
        `${booking.counterpartName} confirmed the booking "${booking.title}".`,
        `Event date: ${booking.eventDate}`,
        `Location: ${booking.location}`,
      ].join('\n\n'),
      html: [
        `<p>${greeting}</p>`,
        `<p><strong>${booking.counterpartName}</strong> confirmed the booking "<strong>${booking.title}</strong>".</p>`,
        `<p>Event date: ${booking.eventDate}<br/>Location: ${booking.location}</p>`,
      ].join(''),
    });
  }

  async sendBookingStartCode(
    to: string,
    booking: BookingStartCodeEmailInput,
  ): Promise<void> {
    const greeting = booking.recipientName ? `Hi ${booking.recipientName},` : 'Hello,';
    await this.sendEmail({
      to,
      subject: `Your VendorApp safety code for ${booking.title}`,
      text: [
        greeting,
        `Your booking "${booking.title}" is confirmed and paid.`,
        `Safety code: ${booking.verificationCode}`,
        'Share this code with the artist when the job is ready to begin.',
        `Event date: ${booking.eventDate}`,
        `Location: ${booking.location}`,
      ].join('\n\n'),
      html: [
        `<p>${greeting}</p>`,
        `<p>Your booking "<strong>${booking.title}</strong>" is confirmed and paid.</p>`,
        `<p><strong>Safety code:</strong> ${booking.verificationCode}</p>`,
        '<p>Share this code with the artist when the job is ready to begin.</p>',
        `<p>Event date: ${booking.eventDate}<br/>Location: ${booking.location}</p>`,
      ].join(''),
    });
  }

  async sendArtistApprovedLive(
    to: string,
    input: ArtistApprovedLiveEmailInput,
  ): Promise<void> {
    const greeting = input.recipientName ? `Hi ${input.recipientName},` : 'Hello,';
    const dashboardUrl = `${this.getWebOrigin()}/dashboard`;

    await this.sendEmail({
      to,
      subject: 'Your VendorApp artist profile is live',
      text: [
        greeting,
        `${input.artistName} has been approved and is now live on VendorApp.`,
        `Open your dashboard: ${dashboardUrl}`,
      ].join('\n\n'),
      html: [
        `<p>${greeting}</p>`,
        `<p><strong>${input.artistName}</strong> has been approved and is now live on VendorApp.</p>`,
        `<p><a href="${dashboardUrl}">Open your dashboard</a></p>`,
      ].join(''),
    });
  }

  private async sendEmail(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim();

    if (!apiKey || !from) {
      if (this.isProduction) {
        throw new Error('RESEND_API_KEY and EMAIL_FROM must be configured in production');
      }

      this.logger.warn(
        JSON.stringify({
          type: 'mailer_skipped',
          reason: 'missing_config',
          to: input.to,
          subject: input.subject,
        }),
      );
      return;
    }

    const client = new Resend(apiKey);
    const response = await client.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    if (response.error) {
      throw new Error(`Resend error: ${response.error.message}`);
    }
  }

  private getWebOrigin(): string {
    return (
      process.env.WEB_ORIGIN?.split(',')[0]?.trim() ||
      process.env.NEXT_PUBLIC_WEB_ORIGIN?.trim() ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  private getApiBaseUrl(): string {
    const explicit =
      process.env.API_PUBLIC_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

    if (explicit) {
      return explicit.replace(/\/+$/, '');
    }

    const port = process.env.API_PORT?.trim() || process.env.PORT?.trim() || '4000';
    return `http://localhost:${port}/api`;
  }
}
