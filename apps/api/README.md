# VendorApp API

NestJS API for VendorApp, now backed by PostgreSQL via Prisma.

## Supabase/PostgreSQL setup

1. Copy `apps/api/.env.example` to `apps/api/.env`.
2. Set:
   - `DATABASE_URL`: pooled Supabase connection string (port `6543`).
   - `DIRECT_URL`: direct Supabase connection string (port `5432`) for migrations.
   - `AUTH_TOKEN_SECRET`: at least 32 random characters.
   - `CSRF_COOKIE_NAME`: cookie used for CSRF double-submit token (default `vendrman_csrf`).
   - `AUTH_PASSWORD_RESET_EXPIRES_MINUTES`, `AUTH_MFA_ISSUER`.
   - `AUTH_RESET_TOKEN_PEPPER` and `AUTH_BACKUP_CODE_PEPPER`.
   - Optional distributed limiter: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
3. Keep `AUTH_COOKIE_SECURE=true` in production.

## CSRF protection

- The API enforces CSRF validation on non-safe methods (`POST`, `PUT`, `PATCH`, `DELETE`) when an auth cookie is present.
- Clients must send `X-CSRF-Token` matching the CSRF cookie value.
- `GET /api/auth/csrf` issues a CSRF cookie and token. The web client already does this automatically before mutating calls.

## Auth security endpoints

- `POST /api/auth/password/forgot`
- `POST /api/auth/password/reset`
- `POST /api/auth/mfa/setup`
- `POST /api/auth/mfa/enable`
- `POST /api/auth/mfa/disable`
- `POST /api/auth/mfa/backup/regenerate`
- `GET /api/auth/google/start`
- `GET /api/auth/google/callback`

## Google OAuth setup

1. Create a Google OAuth 2.0 Web application in Google Cloud Console.
2. Add an authorized redirect URI matching `GOOGLE_OAUTH_REDIRECT_URI`.
   - Local example: `http://localhost:4000/api/auth/google/callback`
3. Set these environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_OAUTH_REDIRECT_URI`
   - Optional: `GOOGLE_OAUTH_STATE_SECRET`

## Prisma commands

```bash
pnpm --filter @vendorapp/api run prisma:generate
pnpm --filter @vendorapp/api run prisma:migrate:deploy
```

For local development:

```bash
pnpm --filter @vendorapp/api run prisma:migrate:dev
```

## Migrate legacy users.json data

After DB schema migration is applied:

```bash
pnpm --filter @vendorapp/api run db:import:users
```

The importer reads `apps/api/data/users.json` and upserts users into PostgreSQL.

## Seed artists and bookings

```bash
pnpm --filter @vendorapp/api run db:seed:core
```

## E2E tests

```bash
pnpm --filter @vendorapp/api run test:e2e
```

CI runs API e2e tests with PostgreSQL using `.github/workflows/api-e2e.yml`.

## Production secrets manager wiring

Use your deployment secrets manager (or GitHub Environment secrets) to inject these values at runtime:

- `AUTH_TOKEN_SECRET`
- `AUTH_RESET_TOKEN_PEPPER`
- `AUTH_BACKUP_CODE_PEPPER`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

In production mode, the API now enforces secure configuration:

- `AUTH_RESET_TOKEN_PEPPER` and `AUTH_BACKUP_CODE_PEPPER` must be set.
- Distributed rate limiting is required by default in production (`UPSTASH_REDIS_*`).

To validate deployment-level secret wiring, run:

- `.github/workflows/api-e2e-production-env.yml`

This workflow uses the `production` GitHub Environment and executes the same generate/migrate/e2e flow with secret-backed auth and Redis configuration.

## Run API

```bash
pnpm --filter @vendorapp/api run dev
```
