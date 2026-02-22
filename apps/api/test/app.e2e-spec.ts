import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/main';

describe('API Security Flows (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    process.env.DATABASE_URL ??=
      'postgresql://vendorapp:vendorapp_password@localhost:5432/vendorapp?schema=public';
    process.env.DIRECT_URL ??=
      'postgresql://vendorapp:vendorapp_password@localhost:5432/vendorapp?schema=public';
    process.env.AUTH_TOKEN_SECRET ??=
      '4f3c56d5379ef4b3800a4c7187ce1c6b6f84e7fb93c8a0d353cc35f198530815';
    process.env.AUTH_EXPOSE_RESET_TOKEN ??= 'true';
    process.env.AUTH_COOKIE_SECURE ??= 'false';
    process.env.AUTH_COOKIE_SAME_SITE ??= 'lax';
    process.env.CSRF_COOKIE_NAME ??= 'vendrman_csrf';
    process.env.AUTH_MFA_ISSUER ??= 'VendorApp';

    prisma = new PrismaClient();
    await prisma.$connect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await configureApp(app);
    await app.init();
  });

  beforeEach(async () => {
    await prisma.authAuditEvent.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.artist.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('enforces CSRF for authenticated mutations and supports login/logout', async () => {
    const agent = request.agent(app.getHttpServer());
    const email = `csrf.${Date.now()}@example.com`;
    const password = 'StrongPass#12345';

    await agent.post('/api/auth/signup').send({
      fullName: 'CSRF Test User',
      username: `csrf_${Date.now()}`,
      email,
      password,
      accountType: 'CLIENT',
    });

    await agent.get('/api/auth/me').expect(200);

    await agent
      .post('/api/bookings')
      .send({
        artistName: 'CSRF Artist',
        artistInitials: 'CA',
        title: 'No token',
        location: 'Cape Town',
        date: '01 Mar 2026',
        amount: 'R1,000',
      })
      .expect(403);

    const csrfToken = await getCsrfToken(agent);
    await agent
      .post('/api/bookings')
      .set('X-CSRF-Token', csrfToken)
      .send({
        artistName: 'CSRF Artist',
        artistInitials: 'CA',
        title: 'With token',
        location: 'Cape Town',
        date: '01 Mar 2026',
        amount: 'R1,000',
      })
      .expect(201);

    await agent.post('/api/auth/logout').set('X-CSRF-Token', csrfToken).expect(201);
    await agent.get('/api/auth/me').expect(401);
  });

  it('supports password reset flow', async () => {
    const agent = request.agent(app.getHttpServer());
    const email = `reset.${Date.now()}@example.com`;
    const oldPassword = 'StrongPass#12345';
    const newPassword = 'NewStrongPass#12345';

    await agent.post('/api/auth/signup').send({
      fullName: 'Reset Test User',
      username: `reset_${Date.now()}`,
      email,
      password: oldPassword,
      accountType: 'CLIENT',
    });

    const resetRequest = await request(app.getHttpServer())
      .post('/api/auth/password/forgot')
      .send({ email })
      .expect(201);

    const resetToken = resetRequest.body.resetToken as string | undefined;
    expect(typeof resetToken).toBe('string');
    expect(resetToken).toBeTruthy();

    await request(app.getHttpServer())
      .post('/api/auth/password/reset')
      .send({
        token: resetToken,
        newPassword,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: oldPassword })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: newPassword })
      .expect(201);
  });

  it('supports MFA setup, enable, and backup code consumption', async () => {
    const agent = request.agent(app.getHttpServer());
    const email = `mfa.${Date.now()}@example.com`;
    const password = 'StrongPass#12345';

    await agent.post('/api/auth/signup').send({
      fullName: 'MFA Test User',
      username: `mfa_${Date.now()}`,
      email,
      password,
      accountType: 'CLIENT',
    });

    const csrfToken = await getCsrfToken(agent);
    const setup = await agent.post('/api/auth/mfa/setup').set('X-CSRF-Token', csrfToken).expect(201);
    const secret = setup.body.secret as string;
    expect(secret).toBeTruthy();
    expect(setup.body.otpauthUrl).toContain('otpauth://');

    const otpCode = authenticator.generate(secret);
    const enable = await agent
      .post('/api/auth/mfa/enable')
      .set('X-CSRF-Token', csrfToken)
      .send({ code: otpCode })
      .expect(201);

    const backupCodes = enable.body.backupCodes as string[];
    expect(Array.isArray(backupCodes)).toBe(true);
    expect(backupCodes.length).toBeGreaterThan(0);

    await agent.post('/api/auth/logout').set('X-CSRF-Token', csrfToken).expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password, backupCode: backupCodes[0] })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password, backupCode: backupCodes[0] })
      .expect(401);
  });

  it('persists auth audit events for failed and successful logins', async () => {
    const email = `audit.${Date.now()}@example.com`;
    const password = 'StrongPass#12345';

    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        fullName: 'Audit Test User',
        username: `audit_${Date.now()}`,
        email,
        password,
        accountType: 'CLIENT',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'WrongPass#12345' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201);

    const events = await prisma.authAuditEvent.findMany({
      where: { emailNormalized: email.toLowerCase() },
      select: { eventType: true, success: true },
      orderBy: { createdAt: 'asc' },
    });

    expect(events.some((event) => event.eventType === 'login_failed' && !event.success)).toBe(true);
    expect(events.some((event) => event.eventType === 'login_success' && event.success)).toBe(true);
  });

  it('enforces IP-based login throttling', async () => {
    const httpServer = app.getHttpServer();
    const baseBody = {
      email: 'ratelimit-user-not-found@example.com',
      password: 'AnyPass#12345',
    };

    let throttled = false;
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const response = await request(httpServer).post('/api/auth/login').send(baseBody);
      if (response.status === 429) {
        throttled = true;
        break;
      }
      expect(response.status).toBe(401);
    }

    expect(throttled).toBe(true);
  });
});

async function getCsrfToken(agent: ReturnType<typeof request.agent>): Promise<string> {
  const response = await agent.get('/api/auth/csrf').expect(200);
  const token = response.body?.csrfToken as string | undefined;
  if (!token) {
    throw new Error('Expected csrfToken from /api/auth/csrf');
  }
  return token;
}
