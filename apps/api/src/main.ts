import { randomUUID, timingSafeEqual } from 'crypto';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function configureApp(app: INestApplication): Promise<void> {
  const logger = new Logger('HTTP');
  const allowedOrigins = (process.env.WEB_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id'],
  });

  const httpAdapter = app.getHttpAdapter().getInstance();
  if (typeof httpAdapter.disable === 'function') {
    httpAdapter.disable('x-powered-by');
  }
  if (process.env.TRUST_PROXY === 'true' && typeof httpAdapter.set === 'function') {
    httpAdapter.set('trust proxy', 1);
  }

  app.use((request, response, next) => {
    const requestId = normalizeHeaderString(request.headers['x-request-id']) || randomUUID();
    request.headers['x-request-id'] = requestId;
    response.setHeader('X-Request-Id', requestId);
    const start = Date.now();

    response.on('finish', () => {
      logger.log(
        JSON.stringify({
          type: 'http_request',
          requestId,
          method: request.method,
          path: request.originalUrl || request.url,
          statusCode: response.statusCode,
          durationMs: Date.now() - start,
          ip: request.ip ?? null,
        }),
      );
    });

    next();
  });

  app.use((_request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-DNS-Prefetch-Control', 'off');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
      response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  const authCookieName = process.env.AUTH_COOKIE_NAME?.trim() || 'vendrman_auth';
  const csrfCookieName = process.env.CSRF_COOKIE_NAME?.trim() || 'vendrman_csrf';
  app.use((request, response, next) => {
    if (isSafeHttpMethod(request.method)) {
      next();
      return;
    }

    const cookies = parseCookies(request.headers.cookie);
    if (!cookies[authCookieName]) {
      next();
      return;
    }

    const csrfCookieToken = cookies[csrfCookieName];
    const csrfHeaderRaw = request.headers['x-csrf-token'];
    const csrfHeaderToken = Array.isArray(csrfHeaderRaw) ? csrfHeaderRaw[0] : csrfHeaderRaw;

    if (
      !csrfCookieToken ||
      !csrfHeaderToken ||
      !constantTimeStringEquals(csrfCookieToken, csrfHeaderToken)
    ) {
      response.status(403).json({ message: 'Invalid CSRF token' });
      return;
    }

    next();
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await configureApp(app);

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);

  console.log(`VendorApp API running on http://localhost:${port}/api`);
}
if (require.main === module) {
  void bootstrap();
}

function isSafeHttpMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  const entries = cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.includes('='))
    .map((chunk) => {
      const separatorIndex = chunk.indexOf('=');
      const key = chunk.slice(0, separatorIndex).trim();
      const value = chunk.slice(separatorIndex + 1).trim();
      try {
        return [key, decodeURIComponent(value)] as const;
      } catch {
        return [key, value] as const;
      }
    });

  return Object.fromEntries(entries);
}

function constantTimeStringEquals(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return timingSafeEqual(aBuffer, bBuffer);
}

function normalizeHeaderString(value: string | string[] | undefined): string {
  if (!value) return '';
  return Array.isArray(value) ? value[0] ?? '' : value;
}
