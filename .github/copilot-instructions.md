# Copilot Instructions for AI Agents

## Project Overview

- **Frameworks:** SvelteKit (frontend), TypeScript, TailwindCSS, DaisyUI
- **Backend:** Drizzle ORM, Redis
- **Auth:** Better-Auth
- **Deployment:** Vercel

## Architecture & Data Flow

- **src/lib/** contains core logic: services, stores, utils, schema, and components
- **src/routes/** contains SvelteKit route files (+page.svelte, +page.server.ts)
- **drizzle/** contains SQL migrations and metadata
- **Environment variables** are required for local/dev and deployment; see `.env.example`
- **Auth** logic is split between client (`auth-client.ts`) and server (`auth/server.ts`)
- **Services** (e.g., `email.service.ts`, `config.service.ts`) encapsulate integrations and business logic
- **Stores** manage app state (see `src/lib/stores/`)

## Developer Workflows

- **Install:** `npm install`
- **Dev server:** `npm run dev` (default port 5173)
- **Type/lint check:** `npm run check`
- **Build:** `vite build`
- **DB migration:** `npm run db migrate` (used in Vercel build)

## Conventions & Patterns

- **TypeScript-first:** All logic and components use TS
- **SvelteKit routing:** Use `+page.svelte` and `+page.server.ts` for UI and server logic
- **Component organization:** UI, icons, forms, actions, etc. are grouped in `src/lib/components/`
- **Constants:** Centralized in `src/lib/const/`
- **Utils:** Shared helpers in `src/lib/utils/`
- **Schema:** Validation and types in `src/lib/schema/`
- **Permissions:** Access control logic in `src/lib/auth/permissions.ts`
- **Email:** Service in `src/lib/services/email.service.ts`

## Integration Points

- **Drizzle ORM:** SQL migrations in `drizzle/`, DB logic in `src/lib/server/db/`
- **Redis:** Used for caching/session (see config/service usage)
- **Deployment:** Vercel

## Examples

- To add a new service: place in `src/lib/services/`, export functions/classes, and use in routes/components
- To add a new route: create folder in `src/routes/`, add `+page.svelte` and/or `+page.server.ts`
- To update DB: add migration in `drizzle/`, run `npm run db migrate`

## References

- See `README.md` for setup and deployment
- See `.env.example` for required environment variables
- See TODOs in `README.md` for ongoing improvements

---

_If any section is unclear or missing, please provide feedback for further refinement._
