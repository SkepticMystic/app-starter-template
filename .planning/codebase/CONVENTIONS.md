# Coding Conventions

**Analysis Date:** 2026-03-07

## Naming Patterns

**Files:**

- Utility files: `*.util.ts` (e.g., `result.util.ts`, `guard.util.ts`, `logger.util.ts`)
- Service files: `*.service.ts` (e.g., `task.service.ts`, `email.service.ts`)
- Remote function files: `*.remote.ts` (e.g., `auth.remote.ts`, `tasks.remote.ts`)
- Schema files: `*.schema.ts` (e.g., `query.schema.ts`, `password.schema.ts`)
- Database model files: `*.model.ts` (e.g., `task.model.ts`, `auth.model.ts`)
- Constants files: `*.const.ts` (e.g., `error.const.ts`, `auth.const.ts`)
- Client files: `*.client.ts` (e.g., `tasks.client.ts`, `index.client.ts`)
- Svelte components: `PascalCase.svelte` (e.g., `TaskForm.svelte`, `Sheet.svelte`)
  - Exception: shadcn-derived UI components use `kebab-case.svelte` (e.g., `button.svelte`, `input.svelte`)

**Functions and Variables:**

- All functions and variables: `snake_case` (e.g., `get_session`, `create_task_remote`, `insert_one`)
- Intentionally unused parameters/variables: prefix with `_` (e.g., `_error`, `_value`)

**Types and Interfaces:**

- Types: `PascalCase` (e.g., `Task`, `SendEmailOptions`, `Result`)
- TypeScript namespaces: `PascalCase` prefixed with `I` for domain interfaces (e.g., `IAuth`, `IOrganization`)
  - `declare namespace IAuth { ... }` co-located with relevant constants in `*.const.ts` files
- Type exports from models: `export type TypeName = typeof Table.$inferSelect` pattern

**Constants:**

- Exported constant objects: `SCREAMING_SNAKE_CASE` (e.g., `ERROR`, `AUTH`, `ORGANIZATION`, `TASKS`)
- Enum-style arrays: `as const` readonly arrays (e.g., `PROVIDER_IDS`, `ROLE_IDS`, `STATUS_IDS`)
- Enum maps follow pattern: `IDS` (readonly array) + `MAP` (lookup object) + `OPTIONS` (select options array)

**Classes:**

- Service classes: `PascalCase` with static methods (e.g., `TaskService`, `EmailValidationService`)
- Database tables: `PascalCase` + `Table` suffix (e.g., `TaskTable`, `UserTable`, `OrganizationTable`)

**Database:**

- Column names: `snake_case` (e.g., `org_id`, `member_id`, `due_date`, `created_at`)
- TypeScript properties: `camelCase` (Drizzle handles conversion)
- Drizzle query operators imported as `operators` namespace

## Code Style

**Formatting:**

- Prettier with oxc parser (`@prettier/plugin-oxc`), Svelte plugin, and TailwindCSS class sorting
- Config: `.prettierrc` — `singleAttributePerLine: true` for HTML/Svelte
- Tailwind stylesheet reference: `src/routes/layout.css`
- Run: `pnpm format`

**Linting:**

- Primary: oxlint (`oxlint --type-aware`) with TypeScript and Unicorn plugins — `.oxlintrc.json`
- Secondary: ESLint with TypeScript-ESLint and svelte-eslint-plugin — `eslint.config.js`
- Pipeline: `oxlint --type-aware && eslint . && prettier --check --experimental-cli .`
- `no-explicit-any` is enforced — avoid `any` types
- TypeScript namespaces explicitly allowed: `@typescript-eslint/no-namespace: off`
- `no-var` enforced for `.ts` files — use `const`/`let` only

## Import Organization

**Path Aliases:**

- `$lib` → `src/lib/`
- `$app` → SvelteKit app module (e.g., `$app/environment`, `$app/server`, `$app/paths`)
- `$env` → SvelteKit environment (e.g., `$env/static/private`)

**Import Style:**

- `import type` used for type-only imports
- External packages imported before internal `$lib` imports (typical pattern)
- Named imports preferred; `import type z from "zod"` for Zod type usage

## Constant/Enum Pattern

Constants use a consistent three-part structure co-located in `src/lib/const/`:

```typescript
// 1. IDS: readonly tuple (source of truth)
const STATUS_IDS = ["pending", "in_progress", "completed"] as const;

// 2. MAP: lookup object typed via namespace
const STATUS_MAP = {
  pending: { label: "Pending" },
} satisfies Record<IMyNamespace.StatusId, { label: string }>;

// 3. Export combined constant + declare namespace for types
export const MY_CONST = {
  STATUS: {
    IDS: STATUS_IDS,
    MAP: STATUS_MAP,
    OPTIONS: STATUS_IDS.map((id) => ({
      value: id,
      label: STATUS_MAP[id].label,
    })),
  },
};

export declare namespace IMyNamespace {
  export type StatusId = (typeof STATUS_IDS)[number];
}
```

Example: `src/lib/const/task.const.ts`, `src/lib/const/auth/auth.const.ts`, `src/lib/const/auth/organization.const.ts`

## Result Pattern

**All service/repo functions return `Result<D, E>`** — never throw (except re-throwing `isValidationError`):

```typescript
// src/lib/interfaces/result.type.ts
type Result<D = undefined, E = undefined> =
  | { ok: true; data: D }
  | { ok: false; error: E };

// Usage
import { result } from "$lib/utils/result.util";

// Success
return result.suc(data);
return result.suc(); // void success

// Error
return result.err(ERROR.INTERNAL_SERVER_ERROR);
return result.err({ message: "Failed to send email" });
return result.err(); // error without payload

// From Better-Auth APIError
return result.from_ba_error(error); // maps to App.Error shape
return result.from_ba_error(error, extras); // with extra fields merged
```

**App.Result type alias** is used for `Result<D, App.Error>` throughout server code.

**Check results with `ok` discriminant:**

```typescript
const res = await TaskService.create(input, session);
if (!res.ok) {
  return result.err(res.error);
}
// res.data is available here
```

## Error Handling

**Standard Error Constants:** `src/lib/const/error.const.ts`

- `ERROR.INTERNAL_SERVER_ERROR`, `ERROR.NOT_FOUND`, `ERROR.FORBIDDEN`, `ERROR.UNAUTHORIZED`, `ERROR.DUPLICATE`, etc.
- Each error: `{ status: number, level: string, code: AppErrorCode, message: string }`

**Error handling patterns by layer:**

_Remote functions_ (`src/lib/remote/`):

```typescript
} catch (error) {
  if (isValidationError(error)) throw error;  // re-throw SvelteKit validation errors

  if (error instanceof APIError) {
    Log.info(error.body, "context_identifier better-auth");
    captureException(error);
    return result.from_ba_error(error);
  } else {
    Log.error(error, "context_identifier unknown");
    captureException(error);
    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
}
```

_Services_ (`src/lib/server/services/`):

```typescript
} catch (error) {
  log.error(error, "method_name.error context");
  captureException(error, { extra: { input } });
  return result.err(ERROR.INTERNAL_SERVER_ERROR);
}
```

_Repo layer_ (`src/lib/server/db/repos/index.repo.ts`):

- Distinguishes `DrizzleQueryError` (duplicate key detection) vs `DrizzleError` vs unknown
- All repo errors logged and sent to Sentry before returning `result.err()`

_Route load functions_ (`+page.server.ts`):

```typescript
if (!res.ok) {
  error(res.error.status ?? 500, res.error);
}
```

**Field-specific form errors** (remote forms):

```typescript
invalid(issue.fieldName("Message")); // field-specific validation error
```

## Logging

**Framework:** Pino (`src/lib/utils/logger.util.ts`)

**Usage:**

```typescript
import { Log } from "$lib/utils/logger.util";

// Top-level in modules
const log = Log.child({ service: "ServiceName" });

// Log with context string (second arg identifies location)
log.error(error, "method_name.error context_description");
log.info(data, "context_identifier better-auth");
Log.error(error, "Repo.query_one.error DrizzleQueryError");
```

**Log level:** Controlled by `LOG_LEVEL` environment variable
**Development:** Pretty-printed via `pino-pretty` with colorize enabled (disable with `NO_COLOR=true`)
**Production:** JSON output (no transport)
**Child loggers:** Services create child loggers: `Log.child({ service: "task" })`

## Module Design

**Namespace objects** — utilities exported as namespace objects (not individual functions):

```typescript
// Pattern: named export of object grouping related functions
export const Strings = { slugify };
export const Guard = { is_nullish, is_nan };
export const Arrays = { find, add, patch, remove, filter };
export const Repo = { query, query_one, insert, insert_one, update, update_one, delete, delete_one };
```

**Class with static methods** — used for services:

```typescript
export class TaskService {
  static async create(input, session): Promise<App.Result<Task>> { ... }
  static async update(input, session): Promise<App.Result<Task>> { ... }
  static async delete(task_id, session): Promise<App.Result<void>> { ... }
}
```

**Plain object module** — used for environment-dependent switching:

```typescript
// Conditional export based on dev/prod
export const EmailService = dev ? of_console_log : of_resend;
```

**Barrel exports:** Not used — import directly from specific files.

## Database Patterns

**Schema definition** (`src/lib/server/db/models/`):

```typescript
export const TaskTable = pgTable("task", {
  ...Schema.id(), // UUID primary key
  // ... columns in snake_case
  ...Schema.timestamps, // createdAt, updatedAt
});

export type Task = typeof TaskTable.$inferSelect;
```

**Zod validation from Drizzle schema:**

```typescript
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";

export const TaskSchema = {
  insert: createInsertSchema(TaskTable, refinements).pick(pick),
  update: createUpdateSchema(TaskTable, refinements)
    .pick(pick)
    .extend({ id: z.uuid() }),
};
```

**All tables require:**

- UUID primary key via `Schema.id()`
- Timestamps via `Schema.timestamps`
- Indexes on foreign key columns

## Svelte 5 Component Patterns

**Props declaration:**

```typescript
let props: {
  mode: "create" | "update";
  on_success?: (d: Task) => MaybePromise<unknown>;
} = $props();
```

**Async data in components** (experimental `async: true`):

```typescript
let tasks = $derived(
  await Client.wrap(get_all_tasks_remote)().then((r) => (r.ok ? r.data : [])),
);
```

**Form handling via remote functions:**

```svelte
<form
  {...form.enhance(async ({ submit }) => {
    await submit();
    const res = form.result;
    if (res?.ok) {
      toast.success("...");
    } else if (res?.error) {
      toast.error(res.error.message);
    }
  })}
>
  <Input {...field.as("text")} />
</form>
```

**Snippets for component slots:**

```svelte
{#snippet children({ close })}
  <TaskForm
    mode="create"
    on_success={close}
  />
{/snippet}
```

## Comments

**When to Comment:**

- `// NOTE:` for non-obvious design decisions or gotchas
- `// WARN:` for surprising TypeScript behavior or runtime edge cases
- `// SOURCE:` to attribute external references (StackOverflow, docs)
- `// TODO:` for known incomplete items
- JSDoc used for exported utility functions with `@example` blocks (e.g., `query_schema`)

---

_Convention analysis: 2026-03-07_
