# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SvelteKit-based application starter template with TypeScript, TailwindCSS, Better-Auth for authentication, Drizzle ORM for database management, and Redis for caching. Uses Svelte 5 with experimental async components and remote functions. Deployed on Vercel.

**Tech Stack**: Node 24, pnpm 10.23.0, Svelte 5, SvelteKit, TypeScript, Drizzle ORM, PostgreSQL (Neon), Redis (Upstash), Better-Auth, Resend (email), Pino (logging)

## Development Commands

### Package Manager

This project uses **pnpm** as the package manager. Always use `pnpm` commands
instead of `npm`. The exact version lives in `packageManager` in
`package.json`, and that is the only place it is written down — do not repeat
it here, because a second copy is a second thing to get wrong.

### Core Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server (port 5173)
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

### Type Checking & Linting

- `pnpm check` - svelte-check, via tsgo
- `pnpm check:slow` - the same on classic tsserver, as an escape hatch
- `pnpm lint` - oxlint, type-aware
- `pnpm lint:fix` - the same, applying safe fixes
- `pnpm format` / `pnpm format:check` - oxfmt
- `pnpm verify` - format:check, lint, check, test:run and knip in one go

### Database Commands

Database commands use a custom script wrapper (`scripts/drizzle/kit.script.ts`) that invokes drizzle-kit:

- `pnpm db:push` - Push schema changes to database (development)
- `pnpm db:generate` - Generate migrations (production env)
- `pnpm db:check` - Verify the migrations folder is consistent (it does NOT
  connect to a database, despite the name)
- `pnpm db:migrate` - Apply migrations (used in Vercel build)
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm db:push:explain` - dry run: print the DDL `db:push` would apply
- `pnpm _db skills` - regenerate the vendored drizzle agent skills. They are
  pinned to a drizzle-kit version, so re-run this after a bump; the bundled
  `drizzle` skill checks for that drift and will say so

### Other Tools

- `pnpm knip` - Find unused files, dependencies, and exports
- `pnpm db:sql "select 1"` - real psql against the dev database, from a
  container. Prefer this over guessing: the schema files say what the schema is
  _meant_ to be; this says what the database actually contains
- `rg` (ripgrep) - use for code search instead of `grep`. Respects
  `.gitignore`, and `rg -P` enables PCRE2 for lookarounds

## Architecture

### Authentication Architecture

- **Better-Auth** integration with custom configuration in `src/lib/auth.ts`
- Split between client (`src/lib/auth-client.ts`) and server (`src/lib/auth.ts`)
- Database session storage disabled in favor of cookie caching
- Custom session fields for organization membership (`member_id`, `member_role`)
- Automatic organization creation on first login via database hook
- Supports multiple auth providers:
  - Email/Password with verification
  - Google OAuth
  - Generic OAuth (Pocket ID)
  - Passkeys
- **Permissions** managed through `src/lib/const/auth/access_control.const.ts`
  with Better-Auth's AccessControl
- Email templates are imported lazily in `auth.ts`, because `email.const` pulls
  in `isomorphic-dompurify` (jsdom, ~310ms at module load) for four callbacks
  that usually never fire

### Database Architecture

- **Drizzle ORM** with PostgreSQL (Neon)
- Schema files use the `*.model.ts` naming convention and live in
  `src/lib/server/db/models/`:
  - `auth.model.ts` - User, Session, Account, Organization, Member, Invitation,
    Passkey, Verification, TwoFactor, APIKey
  - `subscription.model.ts` - Subscription and the Paystack plugin's tables
  - `task.model.ts` - the worked example of an application table
  - `index.schema.ts` - shared helpers (`Schema.id()`, `Schema.timestamps`)
- All tables use UUID primary keys (custom ID generation, not BetterAuth's nanoid)
- Tables are declared with `snakeCase.table(...)` from
  `drizzle-orm/pg-core/casing`, NOT `pgTable`. That is what produces
  `snake_case` column names; drizzle v1 removed the `casing` config option, so
  converting a model back to `pgTable` silently renames every one of its
  columns
- `schema.ts` keys are matched **exactly** by Better-Auth plugins, so a
  plugin-owned model must be registered under the plugin's own camelCase name
  (`paystackTransaction`, not `paystack_transaction`) or the adapter throws
- Redis configured as secondary storage for Better-Auth (rate limiting, caching)
- Redis configured as secondary storage for Better-Auth (rate limiting, caching)

### SvelteKit Configuration

- **Experimental features enabled**:
  - `remoteFunctions: true` - Server functions callable from client (see Remote Functions pattern below)
  - `async: true` - Async components in Svelte 5
- Vercel adapter for deployment
- Build command includes database migration: `vite build && pnpm db migrate`

### Remote Functions Pattern

Remote functions (in `src/lib/remote/`) use SvelteKit's experimental feature to call server code from client:

- Use `form()` from `$app/server` to create type-safe forms
- Use `query()` from `$app/server` to create type-safe queries
- Use `command()` from `$app/server` to create type-safe commands
- First argument: Zod schema for validation
- Second argument: async handler function with validated input
- `form` Handler receives `issue` parameter for field-specific validation errors
- Use `invalid(issue.fieldName(message))` to return field-specific errors
- Use `result.err({ message })` for general errors
- Use `redirect()` to navigate after successful operations
- Example: `src/lib/remote/auth/auth.remote.ts`

### State Management

- Svelte 5 runes for reactive state
- Stores in `src/lib/stores/` for shared state (organizations, session)
- Better-Auth client provides session management

### Service Pattern

- **Email Service** (`src/lib/services/email.service.ts`):
  - Define service interface using `Context.Tag`
  - Implement `EmailLive` (Resend) and `EmailTest` (console log) versions
  - Inject at runtime: `Effect.provideService(EmailService, dev ? EmailTest : EmailLive)`
  - Used in auth configuration for verification emails, password resets, org invites

### Logging

- Custom logging utility using **Pino** (`src/lib/utils/logger.util`)
- Configured with pretty-printing in development
- Use `Log.info()`, `Log.error()`, `Log.debug()`, etc. throughout codebase
- Log level controlled by `LOG_LEVEL` environment variable

## Linting & Formatting

### Linting — Oxlint

Rules live in **`oxlint.config.ts`** at the repo root, imported by
`vite.config.ts` as its `lint` option.

The file has to be a standalone `.ts`, and its header says why at length. In
short: the oxc editor extension can only read an _oxlint_ config file, so while
the rules lived inline in `vite.config.ts` the editor silently linted with stock
oxlint defaults and disagreed with the CLI on every file. It cannot be
`.oxlintrc.json` either, because `vp config` — which runs on every install via
`prepare` — scans for that name, merges it back into `vite.config.ts`, and
deletes it.

- `correctness`, `suspicious` and `perf` are all at **error**. Nothing sits at
  `warn` on purpose: the only automated gate is `vp check --fix` in the
  pre-commit hook and it reads errors only, so a warning is a finding nobody is
  ever required to clear.
- `style`, `pedantic`, `restriction` and `nursery` are off as categories, to be
  ratcheted rule by rule rather than switched on wholesale.
- Svelte's runes are declared in `globals`. They are compiler intrinsics with no
  import, so without that almost every `no-undef` finding is a rune.
- There is **no ESLint**. `eslint-plugin-svelte` was removed: oxlint only hands
  JS plugins the extracted `<script>` AST, never the template, so a quarter of
  that plugin's rules hard-gate off and the rest found nothing. Svelte
  correctness comes from `pnpm check`.

### Formatting — Oxfmt only

Configured in the `fmt` block of **`vite.config.ts`**. Prettier is gone; oxfmt
handles `.svelte` through a bundled printer and sorts Tailwind classes.

Two traps:

- `vp fmt` does **not** read `.oxfmtrc.json`. With no config it silently
  formats a subset, skipping every `.svelte` file, rather than failing. The
  sanity check is that `pnpm format:check` reports roughly as many files as the
  repo has.
- Ignores belong in `fmt.ignorePatterns`, not a `.prettierignore`, so the
  pre-commit hook and the editor LSP honour the same list.

Note oxfmt does **not** reorder imports, so `pnpm format` neither produces nor
enforces an import order.

### Editor

`.vscode/settings.json` and `.zed/settings.json` are committed deliberately, so
the whole team gets the same diagnostics. Both pin the formatter per language,
because a user-level override otherwise leaks in and formats some file types
with another tool.

`oxc.requireConfig` is on, so a missing or unreadable config fails loudly
instead of falling back to stock defaults again.

### TypeScript version

`typescript` is pinned and the editor stays on it with classic tsserver:
**tsgo does not support TSServer plugins**, and the Svelte TS plugin is what
types `./Foo.svelte` imports inside `.ts` files. tsgo is still used where it
pays — `pnpm check` (svelte-check `--tsgo`) and `pnpm lint` (tsgolint).

### Pre-commit

`.vite-hooks/pre-commit` runs `vp staged`, which runs `vp check --fix` over
staged files: format, then lint, then type-check.

## Environment Setup

1. Install the Node version required by `engines` in `package.json`
2. Install the pnpm version pinned in `packageManager` in `package.json`
3. Create `.env` file based on `.env.example`
4. Set up PostgreSQL database (Neon recommended) with development branch
5. Add `DATABASE_URL` to `.env`
6. Optional: Configure Redis with `REDIS_URL` (for Better-Auth rate limiting and caching)
7. Run `pnpm install` to install dependencies
8. Run `pnpm db:push` to create tables
9. Configure auth provider credentials as needed (Google, Pocket ID)
10. Configure email service (Resend) with `RESEND_API_KEY` and `EMAIL_FROM`

## Deployment (Vercel)

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard (see `.env.example`)
3. Create `.env.production` for production database URL (used by `pnpm db:generate` and `pnpm db:check`)
4. Edit build command to: `vite build && pnpm db:migrate`
5. Deploy

## Key Patterns and Conventions

### Code Organization

- **Naming conventions**:
  - Database schema files: `*.models.ts`
  - Remote functions: `*.remote.ts`
  - Services: `*.service.ts`
  - Utilities: `*.util.ts`
- **Import aliases**: Use `$lib`, `$app`, `$env` SvelteKit aliases
- **TypeScript namespaces**: Preferred for organizing related types (e.g., `IAuth.ProviderId`)

### Database Patterns

- All tables use UUID primary keys via `Schema.id()` from `index.schema.ts`
- Timestamps use `Schema.timestamps` helper (createdAt, updatedAt)
- Database columns in `snake_case`, TypeScript in `camelCase` — produced by
  declaring tables with `snakeCase.table(...)`
- Wrap every statement in a `Repo.*` helper so failures become `App.Result`
  rather than throwing; use `Repo.contains()` for any LIKE/ILIKE search term,
  which escapes the wildcards
- Never use BetterAuth's nanoid generation; custom UUID generation is configured

### Error Handling

- Use `result.err({ message })` utility for consistent error responses
- Log errors with context: `Log.error(error, "context_identifier")`
- Better-Auth API errors are instances of `APIError` with `body.code` for error types
- Custom error codes defined in `$lib/auth-client` as `$ERROR_CODES`

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
