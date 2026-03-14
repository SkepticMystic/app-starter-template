# Codebase Structure

**Analysis Date:** 2026-03-07

## Directory Layout

```
app-starter-template/
├── src/
│   ├── lib/                        # Shared application library
│   │   ├── auth.ts                 # Better-Auth server instance (all plugins)
│   │   ├── auth-client.ts          # Better-Auth browser client
│   │   ├── clients/                # Client-side wrappers for remote functions
│   │   │   ├── index.client.ts     # Client.wrap() / Client.better_auth() utilities
│   │   │   ├── auth/               # Auth-specific client wrappers
│   │   │   ├── subscription/       # Subscription client wrappers
│   │   │   ├── transaction/        # Transaction client wrappers
│   │   │   └── tasks.client.ts     # Task-specific client wrapper
│   │   ├── components/             # Svelte UI components
│   │   │   ├── blocks/             # Page-level layout blocks (navbar, sidebar, footer, head)
│   │   │   ├── form/               # Feature-specific form components
│   │   │   │   ├── account/        # Account management forms
│   │   │   │   ├── authenticate/   # Sign-in / sign-up forms
│   │   │   │   ├── auth/           # Auth feature forms (2FA, passkeys, org, invitation)
│   │   │   │   ├── image/          # Image upload forms
│   │   │   │   └── task/           # Task forms
│   │   │   ├── image/              # Image display components
│   │   │   ├── selector/           # OrganizationSelector component
│   │   │   └── ui/                 # Primitive UI components (shadcn-style)
│   │   ├── const/                  # Application constants
│   │   │   ├── app.const.ts        # APP.NAME, APP.URL, APP.ID etc.
│   │   │   └── auth/               # Auth constants (providers, roles, 2FA, access control)
│   │   ├── hooks/                  # Svelte reactive hooks (is-mobile, clipboard)
│   │   ├── interfaces/             # TypeScript types and interfaces
│   │   ├── remote/                 # Server remote functions (callable from client)
│   │   │   ├── auth/               # Auth-related remotes
│   │   │   ├── contact/            # Contact form remote
│   │   │   ├── image/              # Image upload remote
│   │   │   ├── subscription/       # Subscription remotes
│   │   │   ├── tasks/              # Task CRUD remotes
│   │   │   └── transaction/        # Transaction remotes
│   │   ├── schema/                 # Standalone Zod validation schemas
│   │   │   ├── password/           # Password schema
│   │   │   └── query/              # Pagination/query schemas
│   │   ├── server/                 # SERVER-ONLY code (never imported by client)
│   │   │   ├── db/                 # Database layer
│   │   │   │   ├── drizzle.db.ts   # Drizzle ORM + Neon connection instance
│   │   │   │   ├── redis.db.ts     # Upstash Redis client
│   │   │   │   ├── models/         # Table definitions + Zod schemas
│   │   │   │   ├── repos/          # Repository helpers (error normalization)
│   │   │   │   ├── relations.ts    # Drizzle ORM relations
│   │   │   │   └── schema.ts       # Unified schema export for Drizzle + Better-Auth
│   │   │   ├── sdk/                # External SDK clients
│   │   │   │   └── payment/paystack/  # Paystack payment SDK wrapper
│   │   │   └── services/           # Business logic services
│   │   │       ├── adapter/        # Request adapter (IP, user-agent extraction)
│   │   │       ├── auth/           # Auth sub-services (apikey, email, org, passkeys, session)
│   │   │       ├── auth.service.ts # get_session(), authorize_event() — used in every protected handler
│   │   │       ├── captcha/        # Captcha verification service
│   │   │       ├── email.service.ts # Resend email service (dev: console log)
│   │   │       ├── image/          # Image processing + hosting services
│   │   │       ├── rate_limit/     # Redis token-bucket rate limiter
│   │   │       ├── resource/       # Resource service
│   │   │       ├── storage/        # Cloudflare R2 storage service
│   │   │       ├── subscription/   # Subscription management service
│   │   │       ├── task/           # Task CRUD service
│   │   │       └── transaction/    # Paystack transaction service
│   │   ├── stores/                 # Svelte writable/derived stores
│   │   │   ├── session.store.ts    # session + user derived stores
│   │   │   └── organization.store.ts # member + organization stores
│   │   └── utils/                  # Utility functions
│   │       ├── logger.util.ts      # Pino logger instance (Log)
│   │       ├── result.util.ts      # result.suc() / result.err() helpers
│   │       ├── better-auth.util.ts # BetterAuth result conversion helpers
│   │       ├── form/               # Form utility helpers
│   │       ├── array/              # Array utilities
│   │       ├── tanstack/           # TanStack Table utilities
│   │       └── ...                 # dates, strings, urls, format, guard, etc.
│   └── routes/                     # SvelteKit file-based routing
│       ├── +layout.ts              # Root layout: SEO base config
│       ├── +layout.server.ts       # Root layout server: flash message loader
│       ├── +layout.svelte          # Root layout: Sonner, ModeWatcher, analytics
│       ├── +error.svelte           # Global error page
│       ├── layout.css              # Global CSS (imported once)
│       ├── (authed)/               # Route group: authenticated pages
│       │   ├── +layout.svelte      # Authed layout: Sidebar + Navbar + Footer wrapper
│       │   ├── home/               # Home/dashboard page
│       │   ├── tasks/              # Task list + task detail + task edit
│       │   ├── settings/           # Settings pages (profile, account, org, api-key)
│       │   └── admin/              # Admin pages (users, organizations)
│       ├── (marketing)/            # Route group: public/auth pages
│       │   ├── +layout.svelte      # Marketing layout
│       │   ├── +page.svelte        # Landing page
│       │   ├── auth/               # All auth pages (signin, signup, 2FA, verify, etc.)
│       │   ├── contact/            # Contact page
│       │   └── onboarding/         # Post-signup onboarding (org creation)
│       └── sitemap.xml/            # Sitemap server endpoint
├── drizzle/                        # SQL migration files (generated by drizzle-kit)
├── scripts/
│   └── drizzle/                    # Drizzle kit script wrapper
├── infra/                          # OpenTofu/Terraform IaC (Vercel, Neon, Upstash, Cloudflare, Sentry)
├── static/                         # Static assets (favicon, public files)
├── svelte.config.js                # SvelteKit config (Vercel adapter, remote functions, async experimental)
├── drizzle.config.ts               # Drizzle ORM config (snake_case, pg)
├── vite.config.js                  # Vite config (Sentry plugin)
├── tsconfig.json                   # TypeScript config
└── package.json                    # Dependencies + scripts
```

## Directory Purposes

**`src/lib/server/`:**

- Purpose: Server-only code that must never be imported by browser-side components
- Contains: Database, Redis, services, SDKs
- Key files: `db/drizzle.db.ts`, `db/redis.db.ts`, `services/auth.service.ts`, `services/email.service.ts`
- Boundary enforced by SvelteKit — importing from `$lib/server/` in client code throws a build error

**`src/lib/remote/`:**

- Purpose: Server remote functions that cross the client/server boundary
- Contains: `*.remote.ts` files using `form()`, `query()`, `command()` from `$app/server`
- Key files: `auth/auth.remote.ts`, `tasks/tasks.remote.ts`
- Note: Exported functions are callable from client components via SvelteKit experimental remoteFunctions

**`src/lib/clients/`:**

- Purpose: Client-side UX wrappers around remote functions
- Contains: `*.client.ts` files exposing wrapped versions of remote calls
- Key files: `index.client.ts` (Client.wrap utility), `tasks.client.ts`, `auth/*.client.ts`

**`src/lib/components/ui/`:**

- Purpose: Primitive, reusable UI components (shadcn-svelte style)
- Contains: Alert, Button, Card, DataTable, Dialog, Drawer, Field, Input, Modal, Select, Sidebar, Sheet, Table, etc.
- Pattern: Compound component pattern with `-root`, `-content`, `-header` sub-components plus a convenience facade (e.g., `Card.svelte` wraps `card-root.svelte`, `card-header.svelte`, etc.)

**`src/lib/components/blocks/`:**

- Purpose: Page-level structural blocks
- Key files: `navbar/Navbar.svelte`, `sidebar/AppSidebar.svelte`, `footer/FooterBlock.svelte`, `head/SEO.svelte`

**`src/lib/server/db/models/`:**

- Purpose: Drizzle table definitions co-located with Zod insert/update schemas
- Key files: `auth.model.ts` (User, Session, Org, Member, etc.), `task.model.ts`, `image.model.ts`, `subscription.model.ts`, `index.schema.ts` (Schema.id(), Schema.timestamps)

**`src/lib/server/db/repos/`:**

- Purpose: Normalize Drizzle calls into `App.Result<T>` with error classification
- Key files: `index.repo.ts` (Repo object), `image.repo.ts`, `subscription.repo.ts`, `paystack_transaction.repo.ts`

## Key File Locations

**Entry Points:**

- `src/routes/+layout.ts`: Universal layout load (SEO setup)
- `src/routes/+layout.server.ts`: Flash message pass-through
- `src/routes/+layout.svelte`: Global providers (Sonner, ModeWatcher, analytics)
- `src/lib/auth.ts`: Better-Auth server configuration and initialization
- `src/lib/auth-client.ts`: Better-Auth browser client

**Configuration:**

- `svelte.config.js`: SvelteKit adapter + experimental features config
- `drizzle.config.ts`: Database migration config
- `vite.config.js`: Build config with Sentry plugin
- `src/lib/const/app.const.ts`: App-wide constants (name, URL, ID)

**Core Logic:**

- `src/lib/server/services/auth.service.ts`: `get_session()` — used in every protected handler
- `src/lib/server/db/repos/index.repo.ts`: `Repo` — all DB operations go through this
- `src/lib/utils/result.util.ts`: `result.suc()` / `result.err()` — error handling pattern
- `src/lib/utils/logger.util.ts`: `Log` — Pino logger instance used everywhere
- `src/lib/clients/index.client.ts`: `Client.wrap()` — client-side request orchestration

**Database:**

- `src/lib/server/db/drizzle.db.ts`: Drizzle `db` instance
- `src/lib/server/db/redis.db.ts`: Redis `redis` instance
- `src/lib/server/db/schema.ts`: Combined schema for Better-Auth and Drizzle
- `src/lib/server/db/models/index.schema.ts`: `Schema.id()` and `Schema.timestamps` helpers

**Testing:**

- `src/lib/schema/query/query.schema.test.ts`
- `src/lib/utils/array/array.test.ts`
- `src/lib/utils/dates.test.ts`
- `src/lib/utils/format.test.ts`
- `src/lib/utils/guard.test.ts`
- `src/lib/utils/json.test.ts`
- `src/lib/utils/result.test.ts`
- `src/lib/utils/strings.test.ts`
- `src/lib/utils/urls.test.ts`

## Naming Conventions

**Files:**

- Database models: `*.model.ts` (e.g., `task.model.ts`, `auth.model.ts`)
- Remote functions: `*.remote.ts` (e.g., `tasks.remote.ts`, `auth.remote.ts`)
- Services: `*.service.ts` (e.g., `task.service.ts`, `email.service.ts`)
- Utilities: `*.util.ts` (e.g., `result.util.ts`, `logger.util.ts`)
- Client wrappers: `*.client.ts` (e.g., `tasks.client.ts`, `index.client.ts`)
- Constants: `*.const.ts` (e.g., `app.const.ts`, `auth.const.ts`)
- Svelte components: `PascalCase.svelte` for public components (e.g., `TaskForm.svelte`), `kebab-case.svelte` for compound sub-components (e.g., `card-root.svelte`)
- Test files: `*.test.ts` (co-located with the utility being tested)

**Directories:**

- `snake_case` for all directories (e.g., `rate_limit/`, `two_factor/`, `api-key/`)
- Route directories follow URL path segments (e.g., `tasks/[id]/edit/`)

**Exported identifiers:**

- Services: PascalCase class with static methods (e.g., `TaskService.create()`)
- Remotes: `snake_case_remote` suffix (e.g., `create_task_remote`, `get_all_tasks_remote`)
- Clients: PascalCase object (e.g., `TaskClient.delete()`)
- Constants: `UPPER_SNAKE_CASE` object (e.g., `APP`, `TASKS`, `AUTH`)
- Repo: `Repo.query()`, `Repo.insert_one()` etc.
- Logger: `Log` (global), `Log.child({ service: "..." })` per service

## Where to Add New Code

**New Feature (e.g., "projects"):**

- DB model: `src/lib/server/db/models/project.model.ts` (table + Zod schemas)
- Register in schema: `src/lib/server/db/schema.ts`
- Service: `src/lib/server/services/project/project.service.ts`
- Remote functions: `src/lib/remote/projects/projects.remote.ts`
- Client wrapper: `src/lib/clients/projects.client.ts`
- Routes: `src/routes/(authed)/projects/+page.svelte`, `+page.server.ts`
- Tests for utils: `src/lib/utils/<new-util>.test.ts` (co-located)

**New Component:**

- Primitive UI: `src/lib/components/ui/<component-name>/` with sub-components
- Feature form: `src/lib/components/form/<feature>/FeatureForm.svelte`
- Page block: `src/lib/components/blocks/<block>/BlockName.svelte`

**New Constant:**

- `src/lib/const/<domain>.const.ts`

**New Zod Schema (shared):**

- `src/lib/schema/<domain>/<domain>.schema.ts`

**New Utility:**

- `src/lib/utils/<name>.util.ts` with co-located `<name>.util.test.ts`

**New Route:**

- Authenticated: under `src/routes/(authed)/`
- Public/marketing: under `src/routes/(marketing)/`
- API endpoint: `src/routes/<path>/+server.ts`

## Special Directories

**`drizzle/`:**

- Purpose: SQL migration files generated by `drizzle-kit generate`
- Generated: Yes (by `pnpm db:generate`)
- Committed: Yes

**`infra/`:**

- Purpose: OpenTofu (Terraform) infrastructure as code for Vercel, Neon, Upstash, Cloudflare, Sentry
- Generated: Partially (`.terraform/` providers are generated, `.tf` files are committed)
- Committed: Yes (`.tf` files), No (`.terraform/` providers — typically gitignored)

**`.svelte-kit/`:**

- Purpose: SvelteKit build cache and generated types
- Generated: Yes
- Committed: No

**`.vercel/output/`:**

- Purpose: Vercel deployment build output
- Generated: Yes (by `pnpm build`)
- Committed: No

**`static/`:**

- Purpose: Public static assets served at root (favicon.png, etc.)
- Generated: No
- Committed: Yes

**`tmp/`:**

- Purpose: Temporary files (e.g., development scratch)
- Generated: N/A
- Committed: No

---

_Structure analysis: 2026-03-07_
