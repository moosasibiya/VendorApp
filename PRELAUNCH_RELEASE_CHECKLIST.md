# Vendr Studios Pre-Launch Release Checklist

## Required Envs

- Web: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WEB_URL`.
- API: `DATABASE_URL`, `DIRECT_URL`, `WEB_ORIGIN`, `API_PUBLIC_URL` without `/api`, `JWT_SECRET`, `JWT_REFRESH_SECRET` if refresh tokens are introduced, `SESSION_SECRET`, `RESET_TOKEN_PEPPER`, `BACKUP_CODE_PEPPER`.
- Email: `RESEND_API_KEY`, `EMAIL_FROM` formatted like `Vendr Studios <noreply@yourdomain.com>`.
- Rate limiting: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` recommended for production. Without Redis, the API falls back to process-local in-memory limits.
- Cookies/proxy: `AUTH_COOKIE_SECURE=true` on HTTPS, correct `AUTH_COOKIE_DOMAIN` if API and web share a parent domain, `TRUST_PROXY=true` behind a trusted proxy.

## Database Migrations

Run migrations against the hosted production database, not localhost:

```bash
pnpm --filter @vendorapp/api run migrate:deploy
pnpm --filter @vendorapp/api run migrate:status
```

The pre-launch release includes additive migration `20260428120000_add_prelaunch_leads`.

## Waitlist Capture Verification

1. Run `pnpm --filter @vendorapp/api run prisma:generate`.
2. Run `pnpm --filter @vendorapp/api run migrate:deploy` against the hosted DB.
3. Open `/` and submit the launch updates form with a new email.
4. Confirm the page shows the Vendr Studios success message without redirecting.
5. Submit the same email again and confirm it still returns success.
6. Confirm the `prelaunch_leads` row stores `email`, optional `name`, `interestType`, `source=PRELAUNCH_PAGE`, and timestamps.

## Deployment Steps

1. Install dependencies from a clean checkout: `pnpm install`.
2. Generate Prisma client and deploy migrations for the hosted API database.
3. Build the API: `pnpm --filter @vendorapp/api build`.
4. Build the web app: `pnpm --filter @vendorapp/web build`.
5. Deploy API first.
6. Deploy web second with `NEXT_PUBLIC_API_BASE_URL` pointing at the deployed API.
7. Smoke test `/api/health`, `/`, `/signup?accountType=CREATIVE`, and waitlist capture.

## Smoke Tests

- `pnpm smoke:prelaunch` with `NEXT_PUBLIC_WEB_URL` and `NEXT_PUBLIC_API_BASE_URL` set to the target deployment.
- Pre-launch page loads even if API auth is cold/down.
- "Join as an artist" routes to `/signup?accountType=CREATIVE`.
- "Notify me" stores a lead and shows a success message in place.
- Duplicate waitlist submission returns success and does not crash.
- Mobile viewport: hero, CTA buttons, waitlist form, FAQ, and footer do not overflow.
- Keyboard: tab order reaches nav links, CTA buttons, form controls, FAQ summaries, and submit button.

## Rollback Notes

- Web rollback is safe if the API remains ahead; the new endpoint is additive.
- API rollback after the migration leaves the `prelaunch_leads` table unused but harmless.
- If waitlist capture fails in production, temporarily point the CTA to `/signup` while preserving artist signup links.

## Month-One Platform Work

- Server-side app route authorization and loading states.
- Admin workflow for artist pool review, waitlist waves, and launch-slot management.
- End-to-end tests for signup, onboarding, discovery, booking, messaging, payments, and support.
- Media upload/storage hardening and production observability.
