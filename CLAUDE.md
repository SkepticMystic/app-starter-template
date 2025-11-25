# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SvelteKit-based application starter template with TypeScript, TailwindCSS, Better-Auth for authentication, Drizzle ORM for database management, and Redis for caching. Uses Svelte 5 with experimental async components and remote functions. Deployed on Vercel.

**Tech Stack**: Node 22, pnpm 10.23.0, Svelte 5, SvelteKit, TypeScript, Drizzle ORM, PostgreSQL (Neon), Redis (Upstash), Better-Auth, Effect (service DI), Resend (email), Pino (logging)

## Development Commands

### Package Manager

This project uses **pnpm** (v10.23.0) as the package manager. Always use `pnpm` commands instead of `npm`.

### Core Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server (port 5173)
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

### Type Checking & Linting

- `pnpm check` - Run svelte-check for type checking
- `pnpm check:watch` - Run svelte-check in watch mode
- `pnpm lint` - Run oxlint (type-aware), eslint, and prettier checks
- `pnpm format` - Format code with prettier

### Database Commands

Database commands use a custom script wrapper (`scripts/drizzle/kit.script.ts`) that invokes drizzle-kit:

- `pnpm db:push` - Push schema changes to database (development)
- `pnpm db:generate` - Generate migrations (production env)
- `pnpm db:check` - Check migration status (production env)
- `pnpm db:migrate` - Apply migrations (used in Vercel build)
- `pnpm db:studio` - Open Drizzle Studio

### Other Tools

- `pnpm knip` - Find unused files, dependencies, and exports

## Architecture

### Directory Structure

- `src/lib/` - Core application logic
  - `auth/` - Authentication configuration and permissions (Better-Auth setup)
  - `clients/` - Client-side API wrappers
  - `components/` - UI components organized by type (auth, form, ui, daisyui)
  - `const/` - Application constants and configuration
  - `external/` - External service integrations (e.g., Discord)
  - `interfaces/` - TypeScript interfaces
  - `remote/` - SvelteKit remote functions (uses experimental feature)
  - `schema/` - Zod validation schemas
  - `server/` - Server-only code
    - `db/` - Database configuration and schemas
  - `services/` - Business logic services (email, config)
  - `stores/` - Svelte stores for state management
  - `utils/` - Utility functions
- `src/routes/` - SvelteKit file-based routing
- `drizzle/` - SQL migrations and metadata
- `scripts/` - Build and utility scripts
- `static/` - Static assets

### Authentication Architecture

- **Better-Auth** integration with custom configuration in `src/lib/auth.ts`
- Uses **Effect** library for dependency injection (email service)
- Split between client (`auth-client.ts`) and server (`auth/server.ts`)
- Database session storage disabled in favor of cookie caching
- Custom session fields for organization membership (`member_id`, `member_role`)
- Automatic organization creation on first login via database hook
- Supports multiple auth providers:
  - Email/Password with verification
  - Google OAuth
  - Generic OAuth (Pocket ID)
  - Passkeys
- **Permissions** managed through `src/lib/auth/permissions.ts` with AccessControl

### Database Architecture

- **Drizzle ORM** with PostgreSQL (Neon)
- Schema files use `*.models.ts` naming convention
- All tables use UUID primary keys (custom ID generation, not BetterAuth's nanoid)
- Database schemas in `src/lib/server/db/schema/`:
  - `auth.models.ts` - User, Session, Account, Organization, Member, Invitation, Passkey, Verification tables
  - `task.models.ts` - Application-specific tables
  - `index.schema.ts` - Shared schema utilities (ID generation, timestamps)
- Uses `snake_case` for database columns (configured in drizzle.config.ts)
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

## Linting Configuration

### Oxlint

Primary linter with type-aware checking configured in `.oxlintrc.json`:

- TypeScript and Unicorn plugins enabled
- Correctness category disabled (relies on TypeScript compiler)
- Strict unused variable rules with `_` prefix for intentionally unused vars
- Special rules for Svelte files (no-inner-declarations, no-self-assign disabled)

### ESLint

Secondary linter in `eslint.config.js` - runs after oxlint in the lint pipeline.

## Environment Setup

1. Ensure **Node 22** is installed (required by package.json engines)
2. Install **pnpm 10.23.0** (specified in package.json packageManager)
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
- Database columns in `snake_case`, TypeScript in `camelCase` (Drizzle handles conversion)
- Never use BetterAuth's nanoid generation; custom UUID generation is configured

### Error Handling

- Use `result.err({ message })` utility for consistent error responses
- Log errors with context: `Log.error(error, "context_identifier")`
- Better-Auth API errors are instances of `APIError` with `body.code` for error types
- Custom error codes defined in `$lib/auth-client` as `$ERROR_CODES`
