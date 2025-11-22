# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SvelteKit-based application starter template with TypeScript, TailwindCSS, Better-Auth for authentication, Drizzle ORM for database management, and Redis for caching. Uses Svelte 5 with experimental async components and remote functions. Deployed on Vercel.

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
  - `remoteFunctions: true` - Server functions callable from client
  - `async: true` - Async components in Svelte 5
- Vercel adapter for deployment
- Build command includes database migration: `vite build && pnpm db migrate`

### State Management
- Svelte 5 runes for reactive state
- Stores in `src/lib/stores/` for shared state (organizations, session)
- Better-Auth client provides session management

### Form Handling
- **sveltekit-superforms** for type-safe form handling
- **formsnap** for form components
- Zod schemas for validation in `src/lib/schema/`

### Email Service
- Abstracted through Effect service pattern
- Test/Live implementations for dev/prod
- Used for verification emails, password resets, and organization invites

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

1. Create `.env` file based on `.env.example`
2. Set up PostgreSQL database (Neon recommended) with development branch
3. Add `DATABASE_URL` to `.env`
4. Run `pnpm db:push` to create tables
5. Configure auth provider credentials as needed (Google, Pocket ID)

## Deployment (Vercel)

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Edit build command to: `vite build && pnpm db migrate`
4. Deploy
