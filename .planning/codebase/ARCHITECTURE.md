# Architecture

**Analysis Date:** 2026-03-07

## Pattern Overview

**Overall:** SvelteKit full-stack application with layered server/client separation, using remote functions as the primary server communication mechanism (experimental SvelteKit feature).

**Key Characteristics:**

- File-based routing via SvelteKit with two route groups: `(authed)` and `(marketing)`
- Remote functions (`form()`, `query()`, `command()` from `$app/server`) as the primary server-to-client data bridge, replacing REST API calls
- Result-type pattern (`{ ok: true, data }` | `{ ok: false, error }`) used pervasively across all layers
- Organization-scoped multi-tenancy: every data resource is scoped by `org_id` in session
- Server-only code strictly isolated in `src/lib/server/` - never imported by client components

## Layers

**UI Layer (Svelte Components):**

- Purpose: Render pages, handle user interaction
- Location: `src/routes/`, `src/lib/components/`
- Contains: `.svelte` route pages, layout files, UI components, form components
- Depends on: Client layer, Remote layer (imported directly), Stores
- Used by: End users / browser

**Client Layer:**

- Purpose: Wrap remote functions with UX (toasts, confirm dialogs, optimistic updates)
- Location: `src/lib/clients/`
- Contains: `*.client.ts` files exposing `Client.wrap()` / `Client.better_auth()` wrappers
- Depends on: Remote layer (server remote functions)
- Used by: Svelte component `<script>` blocks for mutations

**Remote Functions Layer:**

- Purpose: Type-safe server functions callable from client via SvelteKit experimental feature
- Location: `src/lib/remote/`
- Contains: `*.remote.ts` files using `form()`, `query()`, `command()` from `$app/server`
- Depends on: Service layer, Auth service (`get_session()`), DB (via Repo)
- Used by: Client layer and directly by async Svelte components

**Service Layer:**

- Purpose: Domain business logic, isolated from transport
- Location: `src/lib/server/services/`
- Contains: `*.service.ts` static classes for domain operations (TaskService, EmailService, etc.)
- Depends on: Repository layer, external SDKs
- Used by: Remote functions layer, auth hooks in `src/lib/auth.ts`

**Repository Layer:**

- Purpose: Typed, error-normalized database access
- Location: `src/lib/server/db/repos/`
- Contains: `Repo` object (`index.repo.ts`) with `query`, `insert`, `update`, `delete` variants; domain-specific repo files
- Depends on: Drizzle ORM, DB models
- Used by: Service layer, remote functions (for simple queries)

**Data Layer:**

- Purpose: Database schema definitions and ORM configuration
- Location: `src/lib/server/db/`
- Contains: `drizzle.db.ts` (Neon connection), `redis.db.ts`, `models/*.model.ts`, `schema.ts`, `relations.ts`
- Depends on: `@neondatabase/serverless`, `drizzle-orm`
- Used by: Repository layer, Better-Auth adapter

**Store Layer:**

- Purpose: Reactive client-side state for session and active organization
- Location: `src/lib/stores/`
- Contains: `session.store.ts`, `organization.store.ts` (derived from BetterAuthClient)
- Depends on: `BetterAuthClient` from `src/lib/auth-client.ts`
- Used by: Svelte layout and page components

## Data Flow

**Authenticated Page Load (server-side data):**

1. Route page `.server.ts` calls `get_session()` from `src/lib/server/services/auth.service.ts`
2. `get_session()` calls `auth.api.getSession()` using request headers from `getRequestEvent()`
3. Session contains `org_id`, `member_id`, `member_role`, `active_plan` (set at session create time)
4. Page server loads data via `Repo.query(db.query.X.findFirst(...))` scoped to `org_id`
5. Data returned from `load()` passed as props to `.svelte` page

**Client Action via Remote Function (mutations):**

1. Svelte component calls `Client.wrap(remote_fn)(input)` from a client file
2. `Client.wrap()` optionally shows confirm/prompt dialogs, then invokes the remote function
3. Remote function (`form()`/`command()`) runs on server: validates input via Zod schema
4. Remote handler calls `get_session()`, then calls `ServiceClass.method(input, session.data)`
5. Service calls `Repo.insert_one(db.insert(...).returning())` → returns `App.Result<T>`
6. Result bubbles back through remote → Client.wrap() → shows success toast or warning toast

**Async Component Data Fetch (experimental async Svelte):**

1. Svelte component directly `await`s remote query: `let tasks = $derived(await Client.wrap(get_all_tasks_remote)())`
2. No loader needed - component suspends until data resolves (Svelte 5 async experimental)

**Authentication Flow:**

1. User submits signin form → `signin_credentials_remote` (form remote in `src/lib/remote/auth/auth.remote.ts`)
2. Remote calls `auth.api.signInEmail()` which sets session cookie via `sveltekitCookies`
3. On session create, `databaseHooks.session.create.before` populates `org_id`, `member_id`, `member_role`, `active_plan` from DB
4. Session cookie cached for 5 minutes (no DB session storage)
5. Client gets session state via `BetterAuthClient.useSession()` reactive store

**State Management:**

- Server state: SvelteKit `+page.server.ts` load functions for SSR data
- Server mutations: Remote functions (`form`, `command`)
- Client reactive state: Svelte 5 `$state`/`$derived` runes
- Shared auth state: `session` and `organization` stores in `src/lib/stores/` using BetterAuth reactive hooks

## Key Abstractions

**`App.Result<T>` / `result` utility:**

- Purpose: Typed error handling without exceptions across all service/repo calls
- Definition: `src/lib/interfaces/result.type.ts` — `{ ok: true; data: T } | { ok: false; error: E }`
- Helper: `src/lib/utils/result.util.ts` — `result.suc(data)`, `result.err(error)`, `result.pipe()`, `result.from_ba_error()`
- Pattern: All service and repo methods return `Promise<App.Result<T>>`. Callers check `if (!res.ok) return res`

**`Repo` object:**

- Purpose: Normalize all Drizzle errors into `App.Result<T>` and handle duplicates/not-found
- Location: `src/lib/server/db/repos/index.repo.ts`
- Methods: `query`, `query_one`, `insert`, `insert_one`, `update`, `update_one`, `update_void`, `delete`, `delete_one`
- Pattern: `await Repo.insert_one(db.insert(Table).values({...}).returning())`

**`Client` wrapper:**

- Purpose: Standardize client-side UX around remote function calls (toasts, confirm dialogs)
- Location: `src/lib/clients/index.client.ts`
- Methods: `Client.wrap(remoteFn)`, `Client.better_auth(baFn)`
- Pattern: Domain clients wrap specific remotes: `export const TaskClient = { delete: Client.wrap(delete_task_remote) }`

**Remote Functions:**

- Purpose: Type-safe server-callable functions using SvelteKit experimental feature
- Location: `src/lib/remote/`
- Pattern:
  ```typescript
  export const create_task_remote = form(
    TaskSchema.insert, // Zod schema for validation
    async (input, issue) => {
      const session = await get_session();
      if (!session.ok) return session;
      return TaskService.create(input, session.data);
    },
  );
  ```
- Types: `form()` for mutations with field errors, `query()` for reads, `command()` for simple commands

**Schema + Model co-location:**

- Purpose: DB table definition + Zod schemas co-located in model file
- Location: `src/lib/server/db/models/*.model.ts`
- Pattern: `pgTable` definition → `createInsertSchema(Table)` → exported `TaskSchema.insert` / `TaskSchema.update`

**`Schema` helper:**

- Purpose: Consistent UUID primary key and timestamp columns across all tables
- Location: `src/lib/server/db/models/index.schema.ts`
- Pattern: `...Schema.id()` (UUID PK), `...Schema.timestamps` (createdAt, updatedAt)

## Entry Points

**SvelteKit Root Layout:**

- Location: `src/routes/+layout.svelte`, `src/routes/+layout.ts`, `src/routes/+layout.server.ts`
- Triggers: Every page load
- Responsibilities: Flash message loader, SEO/OpenGraph setup, Umami analytics injection, Partytown setup, Sonner toasts, ModeWatcher (dark mode)

**Better-Auth Instance:**

- Location: `src/lib/auth.ts`
- Triggers: Imported by `src/routes/[...auth]/+server.ts` (handles `/api/auth/**` routes), and server-side via `auth.api.*`
- Responsibilities: All authentication, organization management, session handling, Paystack subscription, 2FA, passkeys, API keys, email verification

**Better-Auth Client:**

- Location: `src/lib/auth-client.ts`
- Triggers: Imported by client-side components and stores
- Responsibilities: Client-side auth state, reactive session store, sign-in/sign-up calls from browser

**Database Connection:**

- Location: `src/lib/server/db/drizzle.db.ts`
- Triggers: Imported by any server-side service/repo needing DB access
- Responsibilities: Neon HTTP connection, Drizzle ORM instance with `snake_case` casing

**Route Groups:**

- `src/routes/(authed)/+layout.svelte` — Wraps all authenticated routes with Sidebar + Navbar + Footer
- `src/routes/(marketing)/+layout.svelte` — Marketing/auth pages layout

## Error Handling

**Strategy:** Result-type pattern at all layers; exceptions only for truly unexpected errors (caught and converted to `result.err`)

**Patterns:**

- Services/repos return `App.Result<T>` — callers check `.ok` before using `.data`
- Remote functions return `App.Result<T>` — `result.err({message, status})` for general errors
- Field validation errors: `invalid(issue.fieldName(message))` in `form()` handlers
- Better-Auth errors: `is_ba_error_code(error, "ERROR_CODE")` for specific codes, `result.from_ba_error(error)` to convert
- All unexpected errors are captured via `captureException(error)` (Sentry) before returning `result.err(ERROR.INTERNAL_SERVER_ERROR)`
- Client layer: `Client.wrap()` catches HTTP errors and shows `toast.warning(res.error.message)` or `toast.error("Internal server error")`

## Cross-Cutting Concerns

**Logging:** Pino via `src/lib/utils/logger.util.ts`. Instance exported as `Log`. Child loggers per service: `Log.child({ service: "TaskService" })`. Pretty-prints in dev, JSON in prod. Level controlled by `LOG_LEVEL` env var.

**Validation:** Zod schemas in two locations: `src/lib/schema/` for shared schemas (password), `src/lib/server/db/models/*.model.ts` for DB-derived schemas using `drizzle-zod`.

**Authentication:** `get_session()` from `src/lib/server/services/auth.service.ts` called at the top of every protected remote function and `+page.server.ts` load. Returns `App.Result<App.Session>`.

**Multi-tenancy:** All data access scoped by `session.data.session.org_id`. Every org-scoped table has `org_id` FK. Services enforce org scope in WHERE clauses.

**Rate Limiting:** `RateLimiter` class in `src/lib/server/services/rate_limit/rate_limit.service.ts` implements token bucket algorithm backed by Redis (Upstash).

---

_Architecture analysis: 2026-03-07_
