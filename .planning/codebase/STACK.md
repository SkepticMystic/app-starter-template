# Technology Stack

**Analysis Date:** 2026-03-07

## Languages

**Primary:**

- TypeScript 5.9.x - All application code (`src/`)
- HTML/CSS - Svelte component templates

**Secondary:**

- JavaScript - Config files (`vite.config.js`, `svelte.config.js`, `eslint.config.js`)

## Runtime

**Environment:**

- Node.js ≥24.13.0 (required by `package.json` engines)

**Package Manager:**

- pnpm 10.30.0 (specified in `package.json` packageManager field)
- Lockfile: `pnpm-lock.yaml` present

## Frameworks

**Core:**

- Svelte 5.53.x — UI component framework (uses Svelte 5 runes syntax)
- SvelteKit 2.53.x — Full-stack application framework, file-based routing, SSR

**Experimental SvelteKit Features (enabled in `svelte.config.js`):**

- `remoteFunctions: true` — Type-safe server functions callable from client components
- `tracing.server: true` — Server-side request tracing
- `instrumentation.server: true` — Server instrumentation hooks
- `compilerOptions.experimental.async: true` — Async Svelte 5 components

**Deployment Adapter:**

- `@sveltejs/adapter-vercel` 6.3.x — Deploys to Vercel serverless/edge functions

**Testing:**

- Vitest 4.0.x — Test runner (config in `vite.config.js`)
- `@vitest/ui` — Browser UI for test runs

**Build/Dev:**

- Vite 8.0.0-beta.16 — Build tool and dev server (overridden via pnpm overrides)
- `vite-node` 5.3.x — Runs database scripts (`scripts/drizzle/kit.script.ts`)
- TailwindCSS 4.2.x — Utility CSS framework (PostCSS and Vite plugin: `@tailwindcss/vite`)
- `@dotenvx/dotenvx` — Loads environment files for db scripts (production env)

## Key Dependencies

**Authentication:**

- `better-auth` 1.5.4 — Auth framework (minimal import used: `better-auth/minimal`)
- `@better-auth/drizzle-adapter` — Database adapter for Better-Auth
- `@better-auth/api-key` — API key plugin
- `@better-auth/passkey` — WebAuthn/Passkey plugin
- `@alexasomba/better-auth-paystack` — Paystack subscription plugin for Better-Auth

**Database ORM:**

- `drizzle-orm` 1.0.0-beta.12 (pinned custom build) — ORM for PostgreSQL
- `drizzle-kit` 1.0.0-beta.12 (pinned custom build) — Schema push/migration tooling
- `drizzle-zod` 0.8.x — Generates Zod schemas from Drizzle table definitions

**Validation:**

- `zod` 4.3.x — Schema validation (used throughout remote functions, forms, and schemas)

**Payments:**

- `@alexasomba/paystack-node` — Paystack REST API client

**Storage / Cloud SDKs:**

- `@aws-sdk/client-s3` 3.1004.x — S3-compatible API client (used for Cloudflare R2)
- `@aws-sdk/s3-request-presigner` — Pre-signed URL generation
- `cloudinary` 2.9.x — Cloudinary image hosting SDK

**Caching / Rate Limiting:**

- `@upstash/redis` 1.36.x — Serverless Redis client (used for Better-Auth secondary storage and custom rate limiting)

**Email:**

- `resend` 6.9.x — Transactional email provider SDK

**Error Tracking:**

- `@sentry/sveltekit` 10.42.x — Sentry error tracking and performance monitoring (server + client)

**Logging:**

- `pino` 10.3.x — Structured JSON logging
- `pino-pretty` 13.1.x — Dev-only pretty-printer for Pino

**UI Components:**

- `bits-ui` 2.16.x — Headless primitive components
- `svelte-sonner` 1.0.x — Toast notifications
- `mode-watcher` 1.1.x — Dark/light mode management
- `vaul-svelte` — Drawer component
- `svelte-toolbelt` 0.10.x — Svelte utility components
- `sveltekit-flash-message` 2.4.x — Flash messages across redirects
- `@tanstack/table-core` 8.21.x — Headless table logic
- `runed` 0.37.x — Svelte 5 rune utilities

**Image:**

- `@unpic/svelte` — Universal image component with CDN transforms
- `sharp` 0.34.x — Server-side image processing
- `thumbhash` — Thumbnail placeholders
- `cloudinary` 2.9.x — Image upload and hosting

**Analytics:**

- `@types/umami` — TypeScript types for Umami analytics

**PDF:**

- `@libpdf/core` 0.2.x — PDF generation

**QR Code:**

- `qrcode-generator` 2.0.x — QR code generation

**Password Strength:**

- `@zxcvbn-ts/core` + language packs — Password strength estimation

**Markdown:**

- `marked` 17.0.x — Markdown parsing
- `isomorphic-dompurify` — HTML sanitization for rendered markdown

**SEO:**

- `svelte-meta-tags` 4.5.x — Meta tag management
- `super-sitemap` 1.0.x — Sitemap generation (`src/routes/sitemap.xml/+server.ts`)

**Captcha:**

- `svelte-turnstile` 0.11.x — Cloudflare Turnstile CAPTCHA component

**Styling Utilities:**

- `tailwind-merge` 3.5.x — Merge Tailwind class names
- `tailwind-variants` 3.2.x — Component variant system
- `tw-animate-css` — Animation utilities for Tailwind
- `@tailwindcss/forms` — Form element base styles
- `@iconify-json/lucide` + `@iconify/tailwind4` — Icon set via Tailwind

**Build Analysis:**

- `sonda` 0.11.x — Bundle size analysis (enabled with `SONDA=1 pnpm build`)
- `knip` 5.85.x — Dead code and unused dependencies detection

## Configuration

**TypeScript (`tsconfig.json`):**

- `strict: true`, `noImplicitOverride`, `noUncheckedIndexedAccess`, `useUnknownInCatchVariables`
- Target: `es2024`, Module: `esnext`, `moduleResolution: bundler`
- `verbatimModuleSyntax: true` (type-only imports use `import type`)
- Extends `.svelte-kit/tsconfig.json` (auto-generated by SvelteKit)

**Database (`drizzle.config.ts`):**

- Dialect: PostgreSQL
- `casing: "snake_case"` — DB columns are snake_case, TypeScript uses camelCase
- Schema glob: `./src/lib/server/db/models/*.model.ts`
- Migration output: `./drizzle/`
- Credentials: `DATABASE_URL` env var

**Environment:**

- Loaded via SvelteKit `$env/static/private` and `$env/static/public`
- Production secrets loaded with `dotenvx` from `.env.production` for db commands
- `.env.local` for local development (not `.env.example` — no example file present)
- Sentry build plugin configured in `.env.sentry-build-plugin`

**Required environment variables:**

```
# Private
DATABASE_URL                  # Neon PostgreSQL connection string
UPSTASH_REDIS_REST_URL        # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN      # Upstash Redis REST token
BETTER_AUTH_SECRET            # Auth secret key
GOOGLE_CLIENT_ID              # Google OAuth (optional)
GOOGLE_CLIENT_SECRET          # Google OAuth (optional)
POCKETID_BASE_URL             # Pocket ID OIDC base URL (optional)
POCKETID_CLIENT_ID            # Pocket ID client ID (optional)
POCKETID_CLIENT_SECRET        # Pocket ID client secret (optional)
PAYSTACK_SECRET_KEY           # Paystack payment secret key
RESEND_API_KEY                # Resend email API key
EMAIL_FROM                    # Sender email address
CAPTCHA_SECRET_KEY            # Cloudflare Turnstile server secret
CLOUDINARY_API_KEY            # Cloudinary image hosting
CLOUDINARY_API_SECRET         # Cloudinary image hosting
CLOUDINARY_CLOUD_NAME         # Cloudinary cloud name
CLOUDINARY_UPLOAD_PRESET      # Cloudinary upload preset
CLOUDFLARE_ACCOUNT_ID         # Cloudflare account (for R2)
R2_ACCESS_KEY_ID              # Cloudflare R2 S3-compatible key
R2_SECRET_ACCESS_KEY          # Cloudflare R2 S3-compatible secret
R2_BUCKET_NAME                # Cloudflare R2 bucket name
LOG_LEVEL                     # Pino log level (e.g. "info", "debug")
NO_COLOR                      # Set "true" to disable pino-pretty colors

# Public (exposed to client)
PUBLIC_BASE_URL               # Application base URL
PUBLIC_SENTRY_DSN             # Sentry DSN for client-side tracking
PUBLIC_CAPTCHA_SITE_KEY       # Cloudflare Turnstile site key
PUBLIC_UMAMI_BASE_URL         # Umami analytics server URL (optional)
PUBLIC_UMAMI_WEBSITE_ID       # Umami website ID (optional)
```

## Build

**Build command (Vercel):** `vite build && pnpm db:migrate`

- Database migrations run automatically during Vercel deploys

**Key build scripts:**

```bash
pnpm dev          # Vite dev server (port 5173)
pnpm build        # Production build
pnpm check        # svelte-check type checking (uses tsgo)
pnpm lint         # oxlint --type-aware && eslint && prettier --check
pnpm format       # prettier write
pnpm db:push      # Drizzle push (dev — no migration files)
pnpm db:generate  # Generate migrations (reads .env.production)
pnpm db:migrate   # Apply migrations (used in Vercel build hook)
pnpm db:studio    # Open Drizzle Studio
```

## Platform Requirements

**Development:**

- Node.js ≥24.13.0
- pnpm 10.30.0

**Production:**

- Vercel (serverless functions via `@sveltejs/adapter-vercel`)
- Neon PostgreSQL (serverless PostgreSQL)
- Upstash Redis (serverless Redis HTTP API)

---

_Stack analysis: 2026-03-07_
