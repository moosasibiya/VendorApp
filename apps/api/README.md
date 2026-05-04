# Vendr Studios API

NestJS API for Vendr Studios, backed by PostgreSQL via Prisma.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (or another local Docker engine) running

## First Run

1. Install dependencies from the repository root:

   ```bash
   pnpm install
   ```

2. Copy the Docker Compose env file at the repository root:

   ```bash
   cp .env.example .env
   ```

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Copy the API env file:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   PowerShell:

   ```powershell
   Copy-Item apps/api/.env.example apps/api/.env
   ```

4. Copy the web env file:

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

   PowerShell:

   ```powershell
   Copy-Item apps/web/.env.example apps/web/.env.local
   ```

5. Start local infrastructure:

   ```bash
   docker compose up -d --wait postgres redis
   ```

   PowerShell:

   ```powershell
   docker compose up -d --wait postgres redis
   docker compose ps
   ```

   The `postgres` service exposes PostgreSQL at `localhost:5432` with:

   ```text
   postgresql://postgres:postgres@localhost:5432/vendorapp?schema=public
   ```

6. Generate Prisma Client:

   ```bash
   pnpm --filter @vendorapp/api run prisma:generate
   ```

   PowerShell:

   ```powershell
   pnpm --filter @vendorapp/api run prisma:generate
   ```

7. Apply database migrations:

   ```bash
   pnpm --filter @vendorapp/api run db:migrate
   ```

8. Seed the database:

   ```bash
   pnpm --filter @vendorapp/api run db:seed:core
   ```

9. Start the apps from the repository root:

   ```bash
   pnpm dev
   ```

   Convenience aliases:

   ```bash
   make dev
   # or
   pnpm run dev:local
   ```

## Local URLs

- API: `http://localhost:4000/api`
- Web: `http://localhost:3000`
- Health: `http://localhost:4000/api/health`

## Windows PowerShell Quick Start

From a clean terminal:

```powershell
cd C:\Users\moosa\Desktop\Dev\VendorApp
pnpm install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
if (!(Test-Path apps/api/.env)) { Copy-Item apps/api/.env.example apps/api/.env }
if (!(Test-Path apps/web/.env.local)) { Copy-Item apps/web/.env.example apps/web/.env.local }
docker compose up -d --wait postgres redis
pnpm --filter @vendorapp/api run prisma:generate
pnpm --filter @vendorapp/api run db:migrate
pnpm --filter @vendorapp/api run db:seed:core
pnpm dev
```

In another PowerShell window, verify:

```powershell
docker compose ps
pnpm --filter @vendorapp/api run migrate:status
Invoke-RestMethod http://localhost:4000/api/health
Invoke-WebRequest http://localhost:3000
```

## Environment Variables

The canonical API env reference lives in `apps/api/.env.example`.

Important local values:

- `DATABASE_URL`: Prisma runtime connection string
- `DIRECT_URL`: direct PostgreSQL connection string for migrations
- `JWT_SECRET`: used as the auth token secret by the current backend
- `WEB_ORIGIN`: allowed web app origin for CORS and cookie redirects
- `API_PORT`: API port, defaults to `4000`
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`: optional in local development, required for distributed rate limiting in production

The current backend also accepts compatibility aliases from `apps/api/.env.example`:

- `GOOGLE_CALLBACK_URL` -> `GOOGLE_OAUTH_REDIRECT_URI`
- `RESET_TOKEN_PEPPER` -> `AUTH_RESET_TOKEN_PEPPER`
- `BACKUP_CODE_PEPPER` -> `AUTH_BACKUP_CODE_PEPPER`
- `JWT_EXPIRES_IN` -> `AUTH_TOKEN_EXPIRES_IN_SECONDS`
- `API_PORT` -> `PORT`

## Google OAuth Setup

1. Open Google Cloud Console and create an OAuth 2.0 Web application.
2. Add this local redirect URI:

   ```text
   http://localhost:4000/api/auth/google/callback
   ```

3. Set the following env vars in `apps/api/.env`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`

## Database Commands

```bash
pnpm --filter @vendorapp/api run prisma:generate
pnpm --filter @vendorapp/api run db:migrate
pnpm --filter @vendorapp/api run db:seed:core
pnpm --filter @vendorapp/api run db:import:users
pnpm --filter @vendorapp/api run db:reset
```

## Local Convenience Commands

From the repository root:

```bash
make dev
make db:migrate
make db:seed
make db:reset
make test
```

If `make` is unavailable, use the equivalent `pnpm` scripts:

```bash
pnpm run dev:local
pnpm run db:migrate
pnpm run db:seed
pnpm run db:reset
pnpm test
```

## Troubleshooting

- If `docker compose up -d --wait` fails, start Docker Desktop first.
- If Prisma cannot connect to `localhost:5432`, confirm the `postgres` container is healthy with `docker compose ps`.
- If port `5432` is already taken, set `POSTGRES_PORT=5433` in root `.env`, then set `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/vendorapp?schema=public` and `DIRECT_URL=postgresql://postgres:postgres@localhost:5433/vendorapp?schema=public` in `apps/api/.env`. Restart with `docker compose up -d --wait postgres`.
- If auth fails on startup, confirm `apps/api/.env` contains `JWT_SECRET` or `SESSION_SECRET`.
- If Google sign-in fails, verify the callback URL matches both the Google console and `apps/api/.env`.
