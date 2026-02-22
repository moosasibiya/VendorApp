import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { AuthResponse, User } from '@vendorapp/shared';
import { randomBytes } from 'crypto';
import type { CookieOptions, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleOauthStartDto } from './dto/google-oauth-start.dto';
import { LoginDto } from './dto/login.dto';
import { MfaDisableDto } from './dto/mfa-disable.dto';
import { MfaEnableDto } from './dto/mfa-enable.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';

type AuthRequest = {
  headers: {
    'x-request-id'?: string;
  };
  ip?: string;
  auth: {
    userId: string;
  };
};

type RequestWithIp = {
  headers: {
    'x-request-id'?: string;
  };
  ip?: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body() input: SignupDto,
    @Req() req: RequestWithIp,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.signup(input, {
      ipAddress: req.ip,
      requestId: req.headers['x-request-id'],
    });
    this.setAuthCookie(response, result.token);
    this.setCsrfCookie(response);
    return { user: result.user };
  }

  @Post('login')
  async login(
    @Body() input: LoginDto,
    @Req() req: RequestWithIp,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(input, {
      ipAddress: req.ip,
      requestId: req.headers['x-request-id'],
    });
    this.setAuthCookie(response, result.token);
    this.setCsrfCookie(response);
    return { user: result.user };
  }

  @Get('google/start')
  googleOauthStart(
    @Query() query: GoogleOauthStartDto,
    @Res() response: Response,
  ): void {
    const url = this.authService.getGoogleAuthorizationUrl({
      mode: query.mode ?? 'login',
      nextPath: query.next ?? (query.mode === 'signup' ? '/onboarding' : '/dashboard'),
      accountType: query.accountType,
    });
    response.redirect(url);
  }

  @Get('google/callback')
  async googleOauthCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() req: RequestWithIp,
    @Res() response: Response,
  ): Promise<void> {
    if (!code || !state) {
      response.redirect(this.buildErrorRedirectUrl('login', '/login', 'missing_code_or_state'));
      return;
    }

    try {
      const result = await this.authService.completeGoogleAuthorization(code, state, {
        ipAddress: req.ip,
        requestId: req.headers['x-request-id'],
      });
      this.setAuthCookie(response, result.token);
      this.setCsrfCookie(response);
      response.redirect(this.buildWebRedirectUrl(result.nextPath));
    } catch {
      const fallback = this.authService.getGoogleFallbackFromState(state);
      response.redirect(this.buildErrorRedirectUrl(fallback.mode, fallback.nextPath, 'google_auth'));
    }
  }

  @Get('csrf')
  csrf(@Res({ passthrough: true }) response: Response): { csrfToken: string } {
    const csrfToken = this.setCsrfCookie(response);
    return { csrfToken };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    await this.authService.logout(req.auth.userId, {
      ipAddress: req.ip,
      requestId: req.headers['x-request-id'],
    });
    this.clearAuthCookie(response);
    this.clearCsrfCookie(response);
    return { success: true };
  }

  @Post('password/forgot')
  async forgotPassword(
    @Body() input: ForgotPasswordDto,
    @Req() req: RequestWithIp,
  ): Promise<{ success: true; resetToken?: string }> {
    const result = await this.authService.requestPasswordReset(input.email, {
      ipAddress: req.ip,
      requestId: req.headers['x-request-id'],
    });
    return { success: true, ...(result.resetToken ? { resetToken: result.resetToken } : {}) };
  }

  @Post('password/reset')
  async resetPassword(
    @Body() input: ResetPasswordDto,
    @Req() req: RequestWithIp,
  ): Promise<{ success: true }> {
    await this.authService.resetPassword(input.token, input.newPassword, {
      ipAddress: req.ip,
      requestId: req.headers['x-request-id'],
    });
    return { success: true };
  }

  @Post('mfa/setup')
  @UseGuards(AuthGuard)
  async setupMfa(
    @Req() req: AuthRequest,
  ): Promise<{ secret: string; otpauthUrl: string }> {
    return this.authService.setupMfa(req.auth.userId, {
      ipAddress: req.ip,
      requestId: req.headers['x-request-id'],
    });
  }

  @Post('mfa/enable')
  @UseGuards(AuthGuard)
  async enableMfa(
    @Req() req: AuthRequest,
    @Body() input: MfaEnableDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ backupCodes: string[] }> {
    const result = await this.authService.enableMfa(req.auth.userId, input.code, {
      ipAddress: req.ip,
      requestId: req.headers['x-request-id'],
    });
    this.setAuthCookie(response, result.token);
    return { backupCodes: result.backupCodes };
  }

  @Post('mfa/disable')
  @UseGuards(AuthGuard)
  async disableMfa(
    @Req() req: AuthRequest,
    @Body() input: MfaDisableDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    const result = await this.authService.disableMfa(
      req.auth.userId,
      {
        mfaCode: input.mfaCode ?? input.code,
        backupCode: input.backupCode,
      },
      {
        ipAddress: req.ip,
        requestId: req.headers['x-request-id'],
      },
    );
    this.setAuthCookie(response, result.token);
    return { success: true };
  }

  @Post('mfa/backup/regenerate')
  @UseGuards(AuthGuard)
  async regenerateMfaBackupCodes(
    @Req() req: AuthRequest,
    @Body() input: MfaVerifyDto,
  ): Promise<{ backupCodes: string[] }> {
    return this.authService.regenerateMfaBackupCodes(req.auth.userId, input, {
      ipAddress: req.ip,
      requestId: req.headers['x-request-id'],
    });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: AuthRequest): Promise<User> {
    return this.authService.getMe(req.auth.userId);
  }

  private setAuthCookie(response: Response, token: string): void {
    response.cookie(this.getAuthCookieName(), token, this.getAuthCookieOptions());
  }

  private clearAuthCookie(response: Response): void {
    response.clearCookie(this.getAuthCookieName(), this.getAuthCookieOptions());
  }

  private setCsrfCookie(response: Response): string {
    const csrfToken = randomBytes(32).toString('hex');
    response.cookie(this.getCsrfCookieName(), csrfToken, this.getCsrfCookieOptions());
    return csrfToken;
  }

  private clearCsrfCookie(response: Response): void {
    response.clearCookie(this.getCsrfCookieName(), this.getCsrfCookieOptions());
  }

  private getBaseCookieOptions(): Omit<CookieOptions, 'httpOnly'> {
    const sameSiteRaw = (process.env.AUTH_COOKIE_SAME_SITE ?? 'lax').toLowerCase();
    const sameSite: Omit<CookieOptions, 'httpOnly'>['sameSite'] =
      sameSiteRaw === 'strict' || sameSiteRaw === 'none' ? sameSiteRaw : 'lax';
    const secureRaw = process.env.AUTH_COOKIE_SECURE;
    const secure =
      secureRaw === undefined ? process.env.NODE_ENV === 'production' : secureRaw === 'true';
    const domain = process.env.AUTH_COOKIE_DOMAIN?.trim();

    return {
      sameSite,
      secure,
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }

  private getAuthCookieOptions(): CookieOptions {
    return {
      ...this.getBaseCookieOptions(),
      httpOnly: true,
    };
  }

  private getCsrfCookieOptions(): CookieOptions {
    return {
      ...this.getBaseCookieOptions(),
      httpOnly: false,
    };
  }

  private getAuthCookieName(): string {
    return process.env.AUTH_COOKIE_NAME?.trim() || 'vendrman_auth';
  }

  private getCsrfCookieName(): string {
    return process.env.CSRF_COOKIE_NAME?.trim() || 'vendrman_csrf';
  }

  private getPrimaryWebOrigin(): string {
    return (
      process.env.WEB_ORIGIN?.split(',')[0]?.trim() ||
      process.env.NEXT_PUBLIC_WEB_ORIGIN?.trim() ||
      'http://localhost:3000'
    );
  }

  private buildWebRedirectUrl(nextPath: string): string {
    const origin = this.getPrimaryWebOrigin().replace(/\/+$/, '');
    const path = nextPath.startsWith('/') ? nextPath : '/dashboard';
    return `${origin}${path}`;
  }

  private buildErrorRedirectUrl(
    mode: 'login' | 'signup',
    nextPath: string,
    code: string,
  ): string {
    const target = mode === 'signup' ? '/signup' : '/login';
    const params = new URLSearchParams({
      error: code,
      next: nextPath,
    });
    return this.buildWebRedirectUrl(`${target}?${params.toString()}`);
  }
}
