# External Integrations

**Analysis Date:** 2026-03-07

## APIs & External Services

**Authentication Providers:**

- **Google OAuth** — Social sign-in via Google accounts
  - SDK/Client: `better-auth` `socialProviders.google`
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional; provider skipped if vars absent)
  - Config: `src/lib/auth.ts`

- **Pocket ID (OIDC)** — Generic OpenID Connect provider (self-hostable)
  - SDK/Client: `better-auth` `genericOAuth` plugin, OIDC discovery URL
  - Auth: `POCKETID_BASE_URL`, `POCKETID_CLIENT_ID`, `POCKETID_CLIENT_SECRET` (optional)
  - Config: `src/lib/auth.ts`

**Payments:**

- **Paystack** — Subscription billing and payment processing
  - SDK/Client: `@alexasomba/paystack-node` → `src/lib/server/sdk/payment/paystack/paystack.payment.sdk.ts`
  - Better-Auth plugin: `@alexasomba/better-auth-paystack` (handles subscription lifecycle)
  - Auth: `PAYSTACK_SECRET_KEY`
  - Used for: organization-level subscriptions, plan management, customer creation on org create

**Email:**

- **Resend** — Transactional email delivery
  - SDK/Client: `resend` npm package → `src/lib/server/services/email.service.ts`
  - Auth: `RESEND_API_KEY`, `EMAIL_FROM`
  - Used for: email verification, password reset, account deletion confirmation, organization invitations
  - Dev mode: emails are console-logged instead of sent (no external call)

**Image Hosting:**

- **Cloudinary** — Image upload, storage, and CDN delivery
  - SDK/Client: `cloudinary` npm package → `src/lib/server/services/image/image_hosting.service.ts`
  - Auth: `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`
  - Used for: user-uploaded images, profile photos
  - Transforms applied at render time via `@unpic/svelte` (not at upload time)

**Error Tracking & Performance:**

- **Sentry** — Error monitoring and performance tracing (client + server)
  - SDK/Client: `@sentry/sveltekit` → `src/hooks.client.ts`, `src/instrumentation.server.ts`, `src/hooks.server.ts`
  - Auth: `PUBLIC_SENTRY_DSN`
  - Features: error capture, Pino log integration, Zod error integration, metrics (distributions), Spotlight in dev
  - Build plugin: `sentrySvelteKit({ telemetry: false })` in `vite.config.js`
  - Build secrets: `.env.sentry-build-plugin`

**Analytics:**

- **Umami** — Privacy-focused web analytics (self-hosted or cloud)
  - Auth: `PUBLIC_UMAMI_BASE_URL`, `PUBLIC_UMAMI_WEBSITE_ID` (optional; script not injected if vars absent)
  - Features: user identification on session load via `window.umami.identify()`

**Captcha:**

- **Cloudflare Turnstile** — Bot protection CAPTCHA
  - SDK/Client: `svelte-turnstile` component + server verification at `https://challenges.cloudflare.com/turnstile/v0/siteverify`
  - Auth: `CAPTCHA_SECRET_KEY` (server), `PUBLIC_CAPTCHA_SITE_KEY` (client)
  - Implementation: `src/lib/server/services/captcha/captcha.service.ts`

**Password Breach Detection:**

- **HaveIBeenPwned** — Checks passwords against known breach databases
  - SDK/Client: `better-auth` `haveIBeenPwned` plugin (HTTP API call)
  - Auth: None (public API)
  - Config: `src/lib/auth.ts`

## Data Storage

**Primary Database:**

- **Neon** — Serverless PostgreSQL
  - SDK/Client: `@neondatabase/serverless` neon HTTP driver → `drizzle-orm/neon-http`
  - Connection: `DATABASE_URL` env var
  - ORM: Drizzle ORM 1.0.0-beta.12
  - Client: `src/lib/server/db/drizzle.db.ts`
  - Schema: `src/lib/server/db/models/*.model.ts`
  - Migrations: `./drizzle/` directory (SQL files)

**Caching / Secondary Storage:**

- **Upstash Redis** — Serverless Redis via HTTP REST API
  - SDK/Client: `@upstash/redis` → `src/lib/server/db/redis.db.ts`
  - Connection: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - Used for:
    1. Better-Auth secondary storage (API keys with `fallbackToDatabase`, rate limiting)
    2. Custom token-bucket rate limiter (`src/lib/server/services/rate_limit/rate_limit.service.ts`)
  - Key prefix: `{APP.ID}:{key}` pattern (e.g., `app-starter:rate_limit:...`)

**File / Object Storage:**

- **Cloudflare R2** — S3-compatible object storage
  - SDK/Client: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (S3-compatible API)
  - Connection: `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
  - Client: `src/lib/server/services/storage/r2.storage.service.ts`
  - Endpoint: `https://{CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
  - Used for: document/PDF storage with presigned download URLs

## Authentication & Identity

**Auth Framework:**

- **Better-Auth** 1.5.4 — Self-hosted authentication library
  - Server config: `src/lib/auth.ts`
  - Client config: `src/lib/auth-client.ts`
  - Database: Drizzle adapter with PostgreSQL (session NOT stored in DB — cookie cache only)
  - Secondary storage: Upstash Redis (API keys, rate limiting)
  - Session additional fields: `org_id`, `member_id`, `member_role`, `active_plan`
  - Verification tokens: NOT stored in DB (stateless/hashed)

**Better-Auth Plugins active:**

- `admin` — User management with `AccessControl` (`src/lib/const/auth/access_control.const.ts`)
- `twoFactor` — TOTP-based 2FA
- `passkey` — WebAuthn/FIDO2 passkeys
- `haveIBeenPwned` — Password breach checking
- `lastLoginMethod` — Tracks last used auth method
- `organization` — Multi-tenant organization management with invitations
- `apiKey` — API key issuance scoped to organizations
- `paystack` (via `@alexasomba/better-auth-paystack`) — Subscription billing
- `genericOAuth` — Pocket ID OIDC provider
- `sveltekitCookies` — SvelteKit-native cookie handling

**Vercel Background Tasks:**

- `waitUntil` from `@vercel/functions` used as `backgroundTasks.handler` in Better-Auth config

## Monitoring & Observability

**Error Tracking:**

- Sentry (see above) — captures exceptions throughout server services and client errors
- `captureException()` called in all service catch blocks

**Logs:**

- Pino with `LOG_LEVEL` env var control
- Pretty-printed in development (colorized unless `NO_COLOR=true`)
- Sentry Pino integration captures structured logs server-side
- All log instances are child loggers: `Log.child({ service: "..." })` pattern

**Performance Metrics:**

- `Sentry.metrics.distribution()` used in `ImageHostingService` for upload/delete timing

## CI/CD & Deployment

**Hosting:**

- Vercel — serverless functions via `@sveltejs/adapter-vercel`
- Build command: `vite build && pnpm db:migrate`
- DB migrations applied automatically at deploy time

**CI Pipeline:**

- Not detected (no GitHub Actions or similar config files found)

## Webhooks & Callbacks

**Incoming:**

- Better-Auth handles auth callback routes internally at `/api/auth/**` (managed by `svelteKitHandler` in `src/hooks.server.ts`)
- Paystack webhook verification handled by the `@alexasomba/better-auth-paystack` plugin using `PAYSTACK_SECRET_KEY`
  - No separate custom webhook route detected; handled through Better-Auth plugin machinery

**Outgoing:**

- None detected (no outgoing webhook dispatch code found)

## Environment Configuration Summary

**Required (app will fail without these):**

- `DATABASE_URL` — Neon PostgreSQL
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis
- `BETTER_AUTH_SECRET` — Auth encryption key
- `PAYSTACK_SECRET_KEY` — Payments
- `RESEND_API_KEY` + `EMAIL_FROM` — Email
- `CAPTCHA_SECRET_KEY` + `PUBLIC_CAPTCHA_SITE_KEY` — CAPTCHA
- `CLOUDINARY_*` (4 vars) — Image hosting
- `CLOUDFLARE_ACCOUNT_ID` + `R2_*` (3 vars) — File storage
- `PUBLIC_BASE_URL` — App URL
- `PUBLIC_SENTRY_DSN` — Error tracking

**Optional (features degrade gracefully):**

- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — Google OAuth disabled if absent
- `POCKETID_*` (3 vars) — Pocket ID OIDC disabled if absent
- `PUBLIC_UMAMI_BASE_URL` + `PUBLIC_UMAMI_WEBSITE_ID` — Analytics script not injected if absent
- `LOG_LEVEL` — Defaults to pino default if absent
- `NO_COLOR` — Colorized logs unless set to `"true"`

---

_Integration audit: 2026-03-07_
