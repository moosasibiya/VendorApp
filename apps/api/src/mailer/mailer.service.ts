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

type InsiderEmailInput = {
  firstName: string;
  userType: 'CLIENT' | 'ARTIST';
  inviteLink?: string;
  referralCount?: number;
};

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const resetUrl = `${this.getWebOrigin()}/reset-password?token=${encodeURIComponent(token)}`;

    await this.sendEmail({
      to,
      subject: 'Reset your Vendr Studios password',
      text: [
        'You requested a password reset for your Vendr Studios account.',
        `Reset your password: ${resetUrl}`,
        'This link expires in 1 hour.',
      ].join('\n\n'),
      html: [
        '<p>You requested a password reset for your Vendr Studios account.</p>',
        `<p><a href="${resetUrl}">Reset your password</a></p>`,
        '<p>This link expires in 1 hour.</p>',
      ].join(''),
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${this.getApiBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}&redirect=1`;

    await this.sendEmail({
      to,
      subject: 'Verify your Vendr Studios email',
      text: [
        'Welcome to Vendr Studios.',
        `Verify your email: ${verifyUrl}`,
        'This link expires in 24 hours.',
      ].join('\n\n'),
      html: [
        '<p>Welcome to Vendr Studios.</p>',
        `<p><a href="${verifyUrl}">Verify your email</a></p>`,
        '<p>This link expires in 24 hours.</p>',
      ].join(''),
    });
  }

  async sendBookingConfirmation(
    to: string,
    booking: BookingEmailInput,
  ): Promise<void> {
    const greeting = booking.recipientName
      ? `Hi ${booking.recipientName},`
      : 'Hello,';
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
    const greeting = booking.recipientName
      ? `Hi ${booking.recipientName},`
      : 'Hello,';
    await this.sendEmail({
      to,
      subject: `Your Vendr Studios safety code for ${booking.title}`,
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
    const greeting = input.recipientName
      ? `Hi ${input.recipientName},`
      : 'Hello,';
    const dashboardUrl = `${this.getWebOrigin()}/dashboard`;

    await this.sendEmail({
      to,
      subject: 'Your Vendr Studios artist profile is live',
      text: [
        greeting,
        `${input.artistName} has been approved and is now live on Vendr Studios.`,
        `Open your dashboard: ${dashboardUrl}`,
      ].join('\n\n'),
      html: [
        `<p>${greeting}</p>`,
        `<p><strong>${input.artistName}</strong> has been approved and is now live on Vendr Studios.</p>`,
        `<p><a href="${dashboardUrl}">Open your dashboard</a></p>`,
      ].join(''),
    });
  }

  async sendInsiderWelcome(
    to: string,
    input: InsiderEmailInput,
  ): Promise<void> {
    const greeting = `Hi ${input.firstName},`;
    await this.sendEmail({
      to,
      subject: 'Welcome to the VendrStudio Insider Programme',
      text: [
        greeting,
        'Welcome to the VendrStudio Insider Programme.',
        'Follow Instagram: https://instagram.com/vendr.studio',
        'Follow TikTok: https://tiktok.com/@vendr.studio',
        'Reply "Done" once complete. Verification is manual for now.',
        'Your personal invite link unlocks after your Insider status is verified.',
      ].join('\n\n'),
      html: [
        `<p>${greeting}</p>`,
        '<p>Welcome to the <strong>VendrStudio Insider Programme</strong>.</p>',
        '<p>Follow <a href="https://instagram.com/vendr.studio">Instagram</a> and <a href="https://tiktok.com/@vendr.studio">TikTok</a>.</p>',
        '<p>Reply <strong>Done</strong> once complete. Verification is manual for now.</p>',
        '<p>Your personal invite link unlocks after your Insider status is verified.</p>',
      ].join(''),
    });
  }

  async sendInsiderActivated(
    to: string,
    input: InsiderEmailInput,
  ): Promise<void> {
    const greeting = `Hi ${input.firstName},`;
    const reward =
      input.userType === 'ARTIST'
        ? 'Artists earn R50 on their first payout per verified referral, capped at R500.'
        : 'Clients receive one entry into the R2,500 photoshoot draw per verified referral.';

    await this.sendEmail({
      to,
      subject: 'Your VendrStudio Insider invite link is live',
      text: [
        greeting,
        'Congratulations. Your Insider status is activated.',
        `Your personal invite link: ${input.inviteLink}`,
        reward,
        'Referrals only count after the person you invited is manually verified.',
      ].join('\n\n'),
      html: [
        `<p>${greeting}</p>`,
        '<p>Congratulations. Your Insider status is activated.</p>',
        `<p>Your personal invite link: <a href="${input.inviteLink}">${input.inviteLink}</a></p>`,
        `<p>${reward}</p>`,
        '<p>Referrals only count after the person you invited is manually verified.</p>',
      ].join(''),
    });
  }

  async sendReferralVerified(
    to: string,
    input: InsiderEmailInput,
  ): Promise<void> {
    const greeting = `Hi ${input.firstName},`;
    const count = input.referralCount ?? 0;
    const reward =
      input.userType === 'ARTIST'
        ? `You now have ${count} verified referral${count === 1 ? '' : 's'}. Your artist bonus is R50 per verified referral, capped at R500.`
        : `You now have ${count} draw entr${count === 1 ? 'y' : 'ies'} for the R2,500 photoshoot draw.`;

    await this.sendEmail({
      to,
      subject: 'A VendrStudio referral was verified',
      text: [
        greeting,
        'Someone joined and was verified through your invite link.',
        reward,
      ].join('\n\n'),
      html: [
        `<p>${greeting}</p>`,
        '<p>Someone joined and was verified through your invite link.</p>',
        `<p>${reward}</p>`,
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
        throw new Error(
          'RESEND_API_KEY and EMAIL_FROM must be configured in production',
        );
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
      process.env.WEB_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  private getApiBaseUrl(): string {
    const publicOrigin = process.env.API_PUBLIC_URL?.trim();
    if (publicOrigin) {
      const normalized = publicOrigin.replace(/\/+$/, '');
      return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
    }

    const port =
      process.env.API_PORT?.trim() || process.env.PORT?.trim() || '4000';
    return `http://localhost:${port}/api`;
  }
}
