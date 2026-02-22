import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes, scryptSync, timingSafeEqual, createHash, createHmac } from 'crypto';
import { authenticator } from 'otplib';
import { OAuth2Client } from 'google-auth-library';
import type { AccountType, User } from '@vendorapp/shared';
import { AuthTokenService } from './auth-token.service';
import type { StoredUser } from './auth.types';
import type { LoginDto } from './dto/login.dto';
import type { SignupDto } from './dto/signup.dto';
import { UsersStore } from './users.store';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { AuthAuditService } from './auth-audit.service';

type AuthResult = {
  token: string;
  user: User;
};

type LoginContext = {
  ipAddress?: string | null;
  requestId?: string | null;
};

type RequestContext = {
  ipAddress?: string | null;
  requestId?: string | null;
};

type MfaVerificationInput = {
  mfaCode?: string;
  backupCode?: string;
};

type GoogleFlowMode = 'login' | 'signup';

type GoogleOauthStartInput = {
  mode: GoogleFlowMode;
  nextPath: string;
  accountType?: AccountType;
};

type GoogleStatePayload = {
  exp: number;
  iat: number;
  nonce: string;
  mode: GoogleFlowMode;
  nextPath: string;
  accountType: AccountType;
};

@Injectable()
export class AuthService {
  private readonly maxFailedLoginAttempts = this.getPositiveIntEnv(
    'AUTH_MAX_FAILED_LOGIN_ATTEMPTS',
    5,
  );
  private readonly lockoutMinutes = this.getPositiveIntEnv('AUTH_LOCKOUT_MINUTES', 15);
  private readonly maxIpAttemptsPerWindow = this.getPositiveIntEnv(
    'AUTH_MAX_LOGIN_ATTEMPTS_PER_WINDOW',
    20,
  );
  private readonly ipWindowSeconds = this.getPositiveIntEnv('AUTH_LOGIN_ATTEMPT_WINDOW_SECONDS', 60);
  private readonly passwordResetExpiresMinutes = this.getPositiveIntEnv(
    'AUTH_PASSWORD_RESET_EXPIRES_MINUTES',
    15,
  );
  private readonly mfaIssuer = process.env.AUTH_MFA_ISSUER?.trim() || 'VendorApp';
  private readonly googleOauthStateTtlSeconds = this.getPositiveIntEnv(
    'GOOGLE_OAUTH_STATE_TTL_SECONDS',
    600,
  );
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly fakeSalt = 'vendrman-auth-fake-salt';
  private readonly fakeHash = this.hashPassword('vendrman-invalid-password', this.fakeSalt);
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly usersStore: UsersStore,
    private readonly tokenService: AuthTokenService,
    private readonly rateLimitService: RateLimitService,
    private readonly authAuditService: AuthAuditService,
  ) {}

  async signup(input: SignupDto, context?: RequestContext): Promise<AuthResult> {
    const emailNormalized = input.email.trim().toLowerCase();
    const username = input.username.trim().replace(/^@+/, '');
    const usernameNormalized = username.toLowerCase();

    if (await this.usersStore.findByEmailNormalized(emailNormalized)) {
      await this.audit('signup_failed', false, {
        emailNormalized,
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
        metadata: { reason: 'email_exists' },
      });
      throw new ConflictException('An account with this email already exists');
    }
    if (await this.usersStore.findByUsernameNormalized(usernameNormalized)) {
      await this.audit('signup_failed', false, {
        emailNormalized,
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
        metadata: { reason: 'username_taken' },
      });
      throw new ConflictException('Username is already taken');
    }

    const passwordSalt = randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(input.password, passwordSalt);

    const user: StoredUser = {
      id: randomBytes(12).toString('hex'),
      fullName: input.fullName.trim(),
      username,
      usernameNormalized,
      email: input.email.trim(),
      emailNormalized,
      accountType: input.accountType,
      createdAt: new Date().toISOString(),
      passwordSalt,
      passwordHash,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      tokenVersion: 0,
      mfaEnabled: false,
    };

    try {
      await this.usersStore.createUser(user);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : '';
        if (target.includes('emailNormalized')) {
          throw new ConflictException('An account with this email already exists');
        }
        if (target.includes('usernameNormalized')) {
          throw new ConflictException('Username is already taken');
        }
      }
      throw error;
    }

    await this.audit('signup_success', true, {
      userId: user.id,
      emailNormalized: user.emailNormalized,
      ipAddress: context?.ipAddress,
      requestId: context?.requestId,
    });

    return {
      token: this.tokenService.sign({
        sub: user.id,
        email: user.email,
        ver: this.getTokenVersion(user),
      }),
      user: this.toPublicUser(user),
    };
  }

  async login(input: LoginDto, context?: LoginContext): Promise<AuthResult> {
    await this.enforceIpRateLimit(context?.ipAddress);

    const emailNormalized = input.email.trim().toLowerCase();
    const user = await this.usersStore.findByEmailNormalized(emailNormalized);
    if (!user) {
      this.simulatePasswordCheck(input.password);
      await this.audit('login_failed', false, {
        emailNormalized,
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
        metadata: { reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }
    if (this.isLockedOut(user)) {
      await this.audit('login_failed', false, {
        userId: user.id,
        emailNormalized,
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
        metadata: { reason: 'account_locked' },
      });
      throw new HttpException(
        'Too many failed login attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const expectedHash = this.hashPassword(input.password, user.passwordSalt);
    const passwordMatches = this.constantTimeEquals(expectedHash, user.passwordHash);
    if (!passwordMatches) {
      await this.recordFailedLoginAttempt(user);
      await this.audit('login_failed', false, {
        userId: user.id,
        emailNormalized,
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
        metadata: { reason: 'password_mismatch' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }
    if (await this.clearFailedLoginState(user)) {
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
    }

    if (user.mfaEnabled) {
      await this.verifyAndConsumeMfa(user, {
        mfaCode: input.mfaCode,
        backupCode: input.backupCode,
      });
    }

    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      ver: this.getTokenVersion(user),
    });

    await this.audit('login_success', true, {
      userId: user.id,
      emailNormalized,
      ipAddress: context?.ipAddress,
      requestId: context?.requestId,
      metadata: { mfaEnabled: Boolean(user.mfaEnabled) },
    });

    return {
      token,
      user: this.toPublicUser(user),
    };
  }

  async logout(userId: string, context?: RequestContext): Promise<void> {
    const user = await this.usersStore.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }
    await this.usersStore.updateAuthFields(user.id, {
      tokenVersion: this.getTokenVersion(user) + 1,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    });
    await this.audit('logout', true, {
      userId: user.id,
      emailNormalized: user.emailNormalized,
      ipAddress: context?.ipAddress,
      requestId: context?.requestId,
    });
  }

  async getMe(userId: string): Promise<User> {
    const user = await this.usersStore.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }
    return this.toPublicUser(user);
  }

  getGoogleAuthorizationUrl(input: GoogleOauthStartInput): string {
    const config = this.getGoogleConfig();
    const nextPath = this.normalizeNextPath(input.nextPath, input.mode === 'signup' ? '/onboarding' : '/dashboard');
    const state = this.createGoogleState({
      mode: input.mode,
      nextPath,
      accountType: input.accountType ?? 'CLIENT',
    });

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: process.env.GOOGLE_OAUTH_PROMPT?.trim() || 'select_account',
      access_type: process.env.GOOGLE_OAUTH_ACCESS_TYPE?.trim() || 'online',
      include_granted_scopes: 'true',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async completeGoogleAuthorization(
    code: string,
    state: string,
    context?: RequestContext,
  ): Promise<{ token: string; nextPath: string }> {
    const config = this.getGoogleConfig();
    const statePayload = this.parseGoogleState(state);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      await this.audit('login_failed', false, {
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
        metadata: {
          reason: 'google_token_exchange_failed',
          status: tokenResponse.status,
        },
      });
      throw new UnauthorizedException('Unable to authenticate with Google');
    }

    const tokenData = (await tokenResponse.json()) as { id_token?: string };
    if (!tokenData.id_token) {
      throw new UnauthorizedException('Missing Google ID token');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokenData.id_token,
      audience: config.clientId,
    });
    const payload = ticket.getPayload();

    const email = payload?.email?.trim();
    const emailVerified = Boolean(payload?.email_verified);
    if (!email || !emailVerified) {
      await this.audit('login_failed', false, {
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
        metadata: { reason: 'google_email_not_verified' },
      });
      throw new UnauthorizedException('Google account email is not verified');
    }

    const fullName =
      payload?.name?.trim() ||
      [payload?.given_name, payload?.family_name].filter(Boolean).join(' ').trim() ||
      email.split('@')[0];

    const authResult = await this.loginOrCreateGoogleUser(
      {
        email,
        fullName,
        accountType: statePayload.accountType,
      },
      context,
    );

    return {
      token: authResult.token,
      nextPath: statePayload.nextPath,
    };
  }

  getGoogleFallbackFromState(state: string | undefined): { mode: GoogleFlowMode; nextPath: string } {
    if (!state) {
      return { mode: 'login', nextPath: '/dashboard' };
    }

    const parsed = this.tryParseGoogleStateWithoutVerification(state);
    if (!parsed) {
      return { mode: 'login', nextPath: '/dashboard' };
    }

    return {
      mode: parsed.mode === 'signup' ? 'signup' : 'login',
      nextPath: this.normalizeNextPath(parsed.nextPath, '/dashboard'),
    };
  }

  async requestPasswordReset(email: string, context?: RequestContext): Promise<{ resetToken?: string }> {
    const emailNormalized = email.trim().toLowerCase();
    const user = await this.usersStore.findByEmailNormalized(emailNormalized);
    if (!user) {
      await this.audit('password_reset_requested', true, {
        emailNormalized,
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
        metadata: { userFound: false },
      });
      return {};
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetHash = this.hashResetToken(resetToken);
    const expiry = new Date(Date.now() + this.passwordResetExpiresMinutes * 60_000).toISOString();

    await this.usersStore.updateAuthFields(user.id, {
      passwordResetHash: resetHash,
      passwordResetExpiry: expiry,
    });

    await this.audit('password_reset_requested', true, {
      userId: user.id,
      emailNormalized: user.emailNormalized,
      ipAddress: context?.ipAddress,
      requestId: context?.requestId,
      metadata: { userFound: true },
    });

    if (process.env.AUTH_EXPOSE_RESET_TOKEN === 'true') {
      return { resetToken };
    }
    return {};
  }

  async resetPassword(
    token: string,
    newPassword: string,
    context?: RequestContext,
  ): Promise<void> {
    const tokenHash = this.hashResetToken(token);
    const user = await this.usersStore.findByPasswordResetHash(tokenHash);
    if (!user || !user.passwordResetExpiry) {
      await this.audit('password_reset_failed', false, {
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
        metadata: { reason: 'token_not_found' },
      });
      throw new UnauthorizedException('Invalid or expired password reset token');
    }
    const expiryMillis = Date.parse(user.passwordResetExpiry);
    if (!Number.isFinite(expiryMillis) || expiryMillis <= Date.now()) {
      await this.usersStore.updateAuthFields(user.id, {
        passwordResetHash: null,
        passwordResetExpiry: null,
      });
      await this.audit('password_reset_failed', false, {
        userId: user.id,
        emailNormalized: user.emailNormalized,
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
        metadata: { reason: 'token_expired' },
      });
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    const passwordSalt = randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(newPassword, passwordSalt);
    await this.usersStore.updateAuthFields(user.id, {
      passwordSalt,
      passwordHash,
      passwordResetHash: null,
      passwordResetExpiry: null,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      tokenVersion: this.getTokenVersion(user) + 1,
    });

    await this.audit('password_reset_success', true, {
      userId: user.id,
      emailNormalized: user.emailNormalized,
      ipAddress: context?.ipAddress,
      requestId: context?.requestId,
    });
  }

  async setupMfa(userId: string, context?: RequestContext): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.usersStore.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }

    const secret = authenticator.generateSecret();
    await this.usersStore.updateAuthFields(user.id, {
      mfaTempSecret: secret,
      mfaEnabled: false,
    });

    const otpauthUrl = authenticator.keyuri(user.email, this.mfaIssuer, secret);
    await this.audit('mfa_setup_started', true, {
      userId: user.id,
      emailNormalized: user.emailNormalized,
      ipAddress: context?.ipAddress,
      requestId: context?.requestId,
    });

    return { secret, otpauthUrl };
  }

  async enableMfa(
    userId: string,
    code: string,
    context?: RequestContext,
  ): Promise<{ backupCodes: string[]; token: string }> {
    const user = await this.usersStore.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }
    if (!user.mfaTempSecret) {
      throw new UnauthorizedException('MFA setup not initialized');
    }

    const valid = authenticator.verify({ token: code, secret: user.mfaTempSecret });
    if (!valid) {
      await this.audit('mfa_enable_failed', false, {
        userId: user.id,
        emailNormalized: user.emailNormalized,
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
      });
      throw new UnauthorizedException('Invalid MFA code');
    }

    const backupCodes = this.generateBackupCodes();
    const backupCodeHashes = backupCodes.map((item) => this.hashBackupCode(item));
    const nextTokenVersion = this.getTokenVersion(user) + 1;
    await this.usersStore.updateAuthFields(user.id, {
      mfaEnabled: true,
      mfaSecret: user.mfaTempSecret,
      mfaTempSecret: null,
      mfaBackupCodeHashes: backupCodeHashes,
      tokenVersion: nextTokenVersion,
    });

    await this.audit('mfa_enabled', true, {
      userId: user.id,
      emailNormalized: user.emailNormalized,
      ipAddress: context?.ipAddress,
      requestId: context?.requestId,
    });

    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      ver: nextTokenVersion,
    });

    return { backupCodes, token };
  }

  async disableMfa(
    userId: string,
    input: MfaVerificationInput,
    context?: RequestContext,
  ): Promise<{ token: string }> {
    const user = await this.usersStore.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }
    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException('MFA is not enabled');
    }

    await this.verifyAndConsumeMfa(user, input);
    const nextTokenVersion = this.getTokenVersion(user) + 1;
    await this.usersStore.updateAuthFields(user.id, {
      mfaEnabled: false,
      mfaSecret: null,
      mfaTempSecret: null,
      mfaBackupCodeHashes: null,
      tokenVersion: nextTokenVersion,
    });

    await this.audit('mfa_disabled', true, {
      userId: user.id,
      emailNormalized: user.emailNormalized,
      ipAddress: context?.ipAddress,
      requestId: context?.requestId,
    });

    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      ver: nextTokenVersion,
    });

    return { token };
  }

  async regenerateMfaBackupCodes(
    userId: string,
    input: MfaVerificationInput,
    context?: RequestContext,
  ): Promise<{ backupCodes: string[] }> {
    const user = await this.usersStore.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found for token');
    }
    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException('MFA is not enabled');
    }

    await this.verifyAndConsumeMfa(user, input);
    const backupCodes = this.generateBackupCodes();
    const backupCodeHashes = backupCodes.map((item) => this.hashBackupCode(item));
    await this.usersStore.updateAuthFields(user.id, {
      mfaBackupCodeHashes: backupCodeHashes,
    });

    await this.audit('mfa_backup_codes_regenerated', true, {
      userId: user.id,
      emailNormalized: user.emailNormalized,
      ipAddress: context?.ipAddress,
      requestId: context?.requestId,
    });

    return { backupCodes };
  }

  private async loginOrCreateGoogleUser(
    input: { email: string; fullName: string; accountType: AccountType },
    context?: RequestContext,
  ): Promise<AuthResult> {
    const emailNormalized = input.email.trim().toLowerCase();
    let user = await this.usersStore.findByEmailNormalized(emailNormalized);
    let created = false;

    if (!user) {
      const usernameBase = this.sanitizeUsername(input.email.split('@')[0] || input.fullName);
      const username = await this.createUniqueUsername(usernameBase);
      const usernameNormalized = username.toLowerCase();
      const passwordSalt = randomBytes(16).toString('hex');
      const passwordHash = this.hashPassword(randomBytes(32).toString('hex'), passwordSalt);

      const newUser: StoredUser = {
        id: randomBytes(12).toString('hex'),
        fullName: input.fullName.trim(),
        username,
        usernameNormalized,
        email: input.email.trim(),
        emailNormalized,
        accountType: input.accountType,
        createdAt: new Date().toISOString(),
        passwordSalt,
        passwordHash,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        tokenVersion: 0,
        mfaEnabled: false,
      };

      try {
        await this.usersStore.createUser(newUser);
        user = newUser;
        created = true;
      } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          user = await this.usersStore.findByEmailNormalized(emailNormalized);
        } else {
          throw error;
        }
      }
    }

    if (!user) {
      throw new UnauthorizedException('Unable to authenticate with Google');
    }

    if (this.isLockedOut(user)) {
      await this.audit('login_failed', false, {
        userId: user.id,
        emailNormalized: user.emailNormalized,
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
        metadata: { reason: 'account_locked', provider: 'google' },
      });
      throw new HttpException(
        'Too many failed login attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (await this.clearFailedLoginState(user)) {
      user.failedLoginAttempts = 0;
      user.lockoutUntil = null;
    }

    const token = this.tokenService.sign({
      sub: user.id,
      email: user.email,
      ver: this.getTokenVersion(user),
    });

    if (created) {
      await this.audit('signup_success', true, {
        userId: user.id,
        emailNormalized: user.emailNormalized,
        ipAddress: context?.ipAddress,
        requestId: context?.requestId,
        metadata: { provider: 'google' },
      });
    }

    await this.audit('login_success', true, {
      userId: user.id,
      emailNormalized: user.emailNormalized,
      ipAddress: context?.ipAddress,
      requestId: context?.requestId,
      metadata: { provider: 'google', created },
    });

    return {
      token,
      user: this.toPublicUser(user),
    };
  }

  private createGoogleState(input: {
    mode: GoogleFlowMode;
    nextPath: string;
    accountType: AccountType;
  }): string {
    const now = Date.now();
    const payload: GoogleStatePayload = {
      iat: now,
      exp: now + this.googleOauthStateTtlSeconds * 1000,
      nonce: randomBytes(12).toString('hex'),
      mode: input.mode,
      nextPath: this.normalizeNextPath(input.nextPath, '/dashboard'),
      accountType: input.accountType,
    };
    const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const signature = createHmac('sha256', this.getGoogleStateSecret())
      .update(encoded)
      .digest('base64url');
    return `${encoded}.${signature}`;
  }

  private parseGoogleState(state: string): GoogleStatePayload {
    const [encoded, signature] = state.split('.');
    if (!encoded || !signature) {
      throw new UnauthorizedException('Invalid Google OAuth state');
    }

    const expectedSignature = createHmac('sha256', this.getGoogleStateSecret())
      .update(encoded)
      .digest('base64url');
    if (!this.constantTimeUtf8Equals(signature, expectedSignature)) {
      throw new UnauthorizedException('Invalid Google OAuth state');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('Invalid Google OAuth state');
    }

    const payload = parsed as Partial<GoogleStatePayload>;
    const mode: GoogleFlowMode = payload.mode === 'signup' ? 'signup' : 'login';
    const accountType = this.normalizeAccountType(payload.accountType);
    const nextPath = this.normalizeNextPath(payload.nextPath, '/dashboard');
    const exp = Number(payload.exp);

    if (!Number.isFinite(exp) || exp <= Date.now()) {
      throw new UnauthorizedException('Google OAuth state expired');
    }

    return {
      iat: Number(payload.iat) || Date.now(),
      exp,
      nonce: String(payload.nonce || ''),
      mode,
      nextPath,
      accountType,
    };
  }

  private tryParseGoogleStateWithoutVerification(state: string): Partial<GoogleStatePayload> | null {
    const [encoded] = state.split('.');
    if (!encoded) return null;

    try {
      const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<GoogleStatePayload>;
      return parsed;
    } catch {
      return null;
    }
  }

  private getGoogleStateSecret(): string {
    const fromEnv = process.env.GOOGLE_OAUTH_STATE_SECRET?.trim();
    if (fromEnv) {
      return fromEnv;
    }
    return this.getAuthTokenSecret();
  }

  private getAuthTokenSecret(): string {
    const secret = process.env.AUTH_TOKEN_SECRET?.trim();
    if (!secret || secret.length < 32) {
      throw new Error('AUTH_TOKEN_SECRET must be set and at least 32 characters');
    }
    return secret;
  }

  private getGoogleConfig(): {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  } {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI must be configured',
      );
    }

    return { clientId, clientSecret, redirectUri };
  }

  private normalizeAccountType(value: unknown): AccountType {
    if (value === 'CREATIVE' || value === 'AGENCY') {
      return value;
    }
    return 'CLIENT';
  }

  private normalizeNextPath(value: unknown, fallback: string): string {
    if (typeof value !== 'string') return fallback;
    const path = value.trim();
    if (!path.startsWith('/') || path.startsWith('//')) {
      return fallback;
    }
    return path;
  }

  private sanitizeUsername(raw: string): string {
    const normalized = raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!normalized) return 'user';
    return normalized.slice(0, 30);
  }

  private async createUniqueUsername(base: string): Promise<string> {
    const cleanBase = this.sanitizeUsername(base);
    const fallback = cleanBase.length >= 3 ? cleanBase : `user_${randomBytes(3).toString('hex')}`;

    for (let i = 0; i < 500; i += 1) {
      const suffix = i === 0 ? '' : `_${i + 1}`;
      const availableLength = Math.max(3, 30 - suffix.length);
      const candidate = `${fallback.slice(0, availableLength)}${suffix}`;
      const exists = await this.usersStore.findByUsernameNormalized(candidate.toLowerCase());
      if (!exists) {
        return candidate;
      }
    }

    return `user_${randomBytes(5).toString('hex')}`.slice(0, 30);
  }

  private toPublicUser(user: StoredUser): User {
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      accountType: user.accountType,
      createdAt: user.createdAt,
    };
  }

  private hashPassword(password: string, salt: string): string {
    return scryptSync(password, salt, 64).toString('hex');
  }

  private constantTimeEquals(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a, 'hex');
    const bBuffer = Buffer.from(b, 'hex');
    if (aBuffer.length !== bBuffer.length) {
      return false;
    }
    return timingSafeEqual(aBuffer, bBuffer);
  }

  private constantTimeUtf8Equals(a: string, b: string): boolean {
    const aBuffer = Buffer.from(a, 'utf8');
    const bBuffer = Buffer.from(b, 'utf8');
    if (aBuffer.length !== bBuffer.length) {
      return false;
    }
    return timingSafeEqual(aBuffer, bBuffer);
  }

  private hashResetToken(token: string): string {
    const pepper = this.getSecretWithDevFallback(
      'AUTH_RESET_TOKEN_PEPPER',
      'dev-reset-token-pepper-change-me',
    );
    return createHash('sha256').update(`${pepper}:${token}`).digest('hex');
  }

  private hashBackupCode(code: string): string {
    const pepper = this.getSecretWithDevFallback(
      'AUTH_BACKUP_CODE_PEPPER',
      'dev-backup-code-pepper-change-me',
    );
    return createHash('sha256').update(`${pepper}:${code}`).digest('hex');
  }

  private getSecretWithDevFallback(name: string, fallback: string): string {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
    if (this.isProduction) {
      throw new Error(`${name} must be set in production`);
    }
    return fallback;
  }

  private simulatePasswordCheck(password: string): void {
    const expectedHash = this.hashPassword(password, this.fakeSalt);
    this.constantTimeEquals(expectedHash, this.fakeHash);
  }

  private isLockedOut(user: StoredUser): boolean {
    if (!user.lockoutUntil) return false;
    const lockoutUntilMillis = Date.parse(user.lockoutUntil);
    if (Number.isNaN(lockoutUntilMillis)) return false;
    return lockoutUntilMillis > Date.now();
  }

  private async recordFailedLoginAttempt(user: StoredUser): Promise<void> {
    const attempts = this.getFailedLoginAttempts(user) + 1;
    if (attempts >= this.maxFailedLoginAttempts) {
      await this.usersStore.updateAuthFields(user.id, {
        failedLoginAttempts: 0,
        lockoutUntil: new Date(Date.now() + this.lockoutMinutes * 60_000).toISOString(),
      });
      return;
    }

    await this.usersStore.updateAuthFields(user.id, {
      failedLoginAttempts: attempts,
      lockoutUntil: null,
    });
  }

  private async clearFailedLoginState(user: StoredUser): Promise<boolean> {
    const failedLoginAttempts = this.getFailedLoginAttempts(user);
    const hasLockout = Boolean(user.lockoutUntil);
    if (failedLoginAttempts === 0 && !hasLockout) {
      return false;
    }
    await this.usersStore.updateAuthFields(user.id, {
      failedLoginAttempts: 0,
      lockoutUntil: null,
    });
    return true;
  }

  private getFailedLoginAttempts(user: StoredUser): number {
    const value = user.failedLoginAttempts;
    if (!Number.isInteger(value) || !value || value < 0) {
      return 0;
    }
    return value;
  }

  private getTokenVersion(user: StoredUser): number {
    const value = user.tokenVersion;
    if (!Number.isInteger(value) || !value || value < 0) {
      return 0;
    }
    return value;
  }

  private getPositiveIntEnv(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return Math.floor(value);
  }

  private async enforceIpRateLimit(ipAddress?: string | null): Promise<void> {
    const key = `auth-login:${ipAddress?.trim() || 'unknown'}`;
    const decision = await this.rateLimitService.consume(
      key,
      this.maxIpAttemptsPerWindow,
      this.ipWindowSeconds,
    );

    if (decision.allowed) {
      return;
    }

    throw new HttpException(
      'Too many login attempts. Please try again shortly.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 8 }).map(() => randomBytes(4).toString('hex').toUpperCase());
  }

  private async verifyAndConsumeMfa(user: StoredUser, input: MfaVerificationInput): Promise<void> {
    if (!user.mfaEnabled || !user.mfaSecret) {
      return;
    }

    if (!input.mfaCode && !input.backupCode) {
      throw new UnauthorizedException('MFA code required');
    }

    if (input.mfaCode) {
      const valid = authenticator.verify({
        token: input.mfaCode,
        secret: user.mfaSecret,
      });
      if (valid) {
        return;
      }
    }

    if (input.backupCode) {
      const codeHash = this.hashBackupCode(input.backupCode);
      const hashes = user.mfaBackupCodeHashes ?? [];
      const matchIndex = hashes.findIndex((storedHash) => this.constantTimeEquals(storedHash, codeHash));
      if (matchIndex >= 0) {
        const remaining = hashes.filter((_, index) => index !== matchIndex);
        await this.usersStore.updateAuthFields(user.id, {
          mfaBackupCodeHashes: remaining,
        });
        await this.audit('mfa_backup_code_used', true, {
          userId: user.id,
          emailNormalized: user.emailNormalized,
        });
        return;
      }
    }

    throw new UnauthorizedException('Invalid MFA code');
  }

  private async audit(
    eventType: string,
    success: boolean,
    input: {
      userId?: string | null;
      emailNormalized?: string | null;
      ipAddress?: string | null;
      requestId?: string | null;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.authAuditService.log({
      eventType,
      success,
      userId: input.userId,
      emailNormalized: input.emailNormalized,
      ipAddress: input.ipAddress,
      requestId: input.requestId,
      metadata: input.metadata,
    });
  }
}
