# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SvelteKit-based application starter template with TypeScript, TailwindCSS, Better-Auth for authentication, Drizzle ORM for database management, and Redis for caching. Uses Svelte 5 with experimental async components and remote functions. Deploys to Vercel by default, and runs as a plain Node
server anywhere else (see `Dockerfile`).

**Tech Stack**: Node 26, pnpm, Svelte 5, SvelteKit, TypeScript, Drizzle ORM, PostgreSQL (Neon), Redis (Upstash), Better-Auth, Resend (email), Pino (logging)

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

- `pnpm check` - svelte-check, via tsgo, then `check:scripts`
- `pnpm check:scripts` - `tsconfig.scripts.json`: holds what bare `node` runs
  (`scripts/db/migrate.script.ts`) to erasable syntax. Add a new bare-`node`
  entrypoint to its `include`
- `pnpm check:slow` - the same on classic tsserver, as an escape hatch
- `pnpm lint` - oxlint, type-aware
- `pnpm lint:fix` - the same, applying safe fixes
- `pnpm format` / `pnpm format:check` - oxfmt
- `pnpm verify` - format:check, lint, check, test:run and knip in one go
- `pnpm env:check` - structural invariants on `src/env.ts`: every variable has
  a description and a schema, and the `PUBLIC_` prefix agrees with the
  `public` flag. Needs no credentials
- `pnpm auth:check` - Better-Auth's own schema diff: can `schema.ts` hold what
  `src/lib/auth.ts` writes? It loads the real config with the test suite's
  environment (`src/test/env.mock.ts`), so it needs no secrets either. Run it
  after adding a Better-Auth plugin or a field to one

### Testing

- `pnpm test` - `vp test`
- `pnpm test:run` - a single run
- `pnpm test:ui` - Vitest UI
- `pnpm test:coverage` - a single run with coverage

Vitest is bundled **inside** Vite+, so there is no `vitest` dependency and no
`vitest.config.ts`; all of it is the `test` block of `vite.config.ts`, whose
`dir: "src"` keeps it from collecting copies in `.claude/worktrees/*`.

Four things about this suite are not guessable from reading a test file:

- **Import from `vite-plus/test`, never `vitest`.**
- **`expect.requireAssertions: true`** — a test that asserts nothing fails.
- **`isolate: false`, and there is one rule that keeps it safe.** A worker
  shares one module registry across files, so a module is evaluated **once per
  worker** and every file in that worker gets the same instance of it. A
  `vi.mock` in a test file therefore does not belong to that file: whichever
  file evaluates a service first decides which mock the service is wired to,
  and every later file configures an object nobody consults. That is not a
  failure any assertion names — it surfaces as an unrelated suite going quiet,
  in a different file on every run.

  > **Every mocked module is mocked exactly once, in `src/test/setup.ts`, and
  > its factory returns an instance memoised on `globalThis`.**

  `globalThis` rather than a module binding because `setupFiles` re-run before
  _every_ test file and rebuild each factory's result, while the app modules
  from earlier files keep the first one. Per-worker state is the only kind that
  survives. `src/test/automock.ts` is the machinery (`memo`, `automock`,
  `mock_module`); `env.mock.ts`, `auth.mock.ts` and `rate_limit.mock.ts` are
  the knob modules that hold what a test needs to drive.

  **So a test file does not call `vi.mock`.** It imports the module normally
  and configures the shared instance — `vi.mocked(Repo.exists)
.mockResolvedValue(…)`, `mocks(MembershipQuery).for_user…` or
  `install_mock(MembershipQuery, fake)` for a behaviour-rich fake, both from
  `src/test/helpers.ts`. `install_mock` throws on a name that is not one of the
  real module's functions, since anything it defined would outlive the file on
  the shared instance. Where the subject under test is _itself_ on the wall,
  the file asks for the real one with
  `await vi.importActual<typeof import("./x")>("./x")`; a subject that is not
  on the wall is imported normally. A new module to mock goes on the wall —
  usually one `mock_module` call, which reads the real module's shape, so a
  method added later is mocked the moment it is written.

  A `beforeEach` in the setup file calls `vi.resetAllMocks()` and
  `reset_env()`. That is why every seeded spy on the wall is `vi.fn(impl)`:
  `mockReset` restores only an implementation given to `vi.fn` itself, so a
  `.mockResolvedValue()` seed would come back `undefined`. Install what a test
  needs in its own `beforeEach`, which runs after this one.

- **Two projects, `server` and `sql`.** A SQL test compiles real SQL, so it
  needs `drizzle.db` to be a genuine drizzle and `index.repo` to be the real
  wrapper — the exact opposite of what every other file needs. One module
  cannot hold two values in one registry, so `index.repo.test.ts` and every
  `*.query.test.ts` run as their own project with `src/test/setup.sql.ts`: drizzle over
  `pg-proxy`, which compiles the same Postgres dialect `node-postgres` sends, and
  records each statement instead. A SQL test reads `recorder.calls` and queues
  answers on `recorder.rows` (`src/test/sql.mock.ts`) — positional rows
  (`[["id", "role"]]`) for a builder or relational query. `SQL_TESTS` in
  `vite.config.ts` is both the `server` project's `exclude` and the `sql`
  project's `include`, so they cannot drift.

**The environment is derived, never restated.** `src/test/env.mock.ts` builds
both `$app/env/*` mocks from `src/env.ts`: an explicit test value where one is
listed, else the variable's `placeholder`, else what its schema makes of
"unset" (`undefined` for optional, the default for defaulted), else a
generated `mock-*`. A newly declared variable is mocked the moment it exists.
`set_env({ … })` in a `beforeEach` overrides a private one for that test — it
reaches a reader that looks the value up at call time, not a module that copied
it at load (`REDIS_PREFIX`, the SDK clients). The public mock is frozen: those
variables are static in production, so overriding one tests something that
cannot happen.

Tests are colocated as `*.test.ts` next to the module. Coverage is scoped to
`src/lib/server/services/**` and has no thresholds. `src/routes/` and
`.svelte` files have no tests — Svelte correctness comes from `pnpm check`.

### Database Commands

Database commands use a custom script wrapper (`scripts/drizzle/kit.script.ts`) that invokes drizzle-kit:

- `pnpm db:push` - Push schema changes to database (development)
- `pnpm db:generate` - Generate migrations (production env)
- `pnpm db:check` - Verify the migrations folder is consistent (it does NOT
  connect to a database, despite the name)
- `pnpm db:migrate` - Apply migrations via drizzle-kit (used in the Vercel
  build)
- `pnpm db:migrate:run` - the same migrations via the runtime driver, with no
  drizzle-kit and so no devDependencies. This is the one to run as a one-shot
  step before rolling out containers, not from a container entrypoint. It
  applies pending migrations in one transaction under an advisory lock, so a
  failure rolls back and two runs queue — which needs a direct connection, not
  Neon's transaction-mode `-pooler` host
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm db:push:explain` - dry run: print the DDL `db:push` would apply
- `pnpm _db skills` - regenerate the vendored drizzle agent skills. They are
  pinned to a drizzle-kit version, so re-run this after a bump; the bundled
  `drizzle` skill checks for that drift and will say so

### Other Tools

- `pnpm knip` - Find unused files, dependencies, and exports
- `pnpm knip:ci` - the same, files and dependencies only; what CI gates on.
  Every `*.remote.ts` is an entry (kit serves it whether or not a page imports
  it), and so are the opt-in kits no page wires yet (image upload, Paystack
  billing, markdown) — see `knip.config.ts`
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

- **Drizzle ORM** with PostgreSQL (Neon, or any Postgres), over
  `node-postgres`: `drizzle.db.ts` exports a `pg` Pool and `db`, so
  `db.transaction` is a real interactive transaction. The pool is small per
  instance (`max: 5`), handed to `AdapterService.attach_db_pool` so Vercel
  closes idle connections before suspending, and ended on
  `sveltekit:shutdown`. In production and preview `DATABASE_URL` is Neon's
  `-pooler` (pgbouncer, transaction mode) endpoint, so the instances' pools
  share one connection budget; nothing may rely on session state (`SET`,
  session advisory locks, `LISTEN`) outside a transaction. Migrations connect
  direct: `DATABASE_URL_UNPOOLED` when set (`infra/app_env.tf`, the app never
  reads it), and `drizzle.config.ts` and the migrate script strip `-pooler`
  from `DATABASE_URL` otherwise
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

### SvelteKit Configuration

- **Experimental features enabled**:
  - `remoteFunctions: true` - Server functions callable from client (see Remote Functions pattern below)
  - `async: true` - Async components in Svelte 5
  - `forkPreloads` — **tried and reverted in a fork of this template; do not
    enable without a fix.** It makes a hover _render_ the target page in a
    Svelte fork rather than only run its `load`, and it produced rendering
    errors on ordinary navigation across many pages — the shape being a
    `$derived` on the outgoing page re-running against the incoming route's
    data. Never reduced to a standalone repro, so treat the mechanism as open
- SvelteKit 3: there is no `svelte.config.js`. All SvelteKit and Svelte
  compiler options are passed to the `sveltekit(...)` plugin in
  `vite.config.ts`
- Adapter is chosen in `vite.config.ts` by whether `VERCEL` is set in the
  build environment: `adapter-vercel` on Vercel, `adapter-node` everywhere
  else. Not `adapter-auto` — it takes no options and has no fallback for a
  plain container, so off-platform it warns and emits no server at all
- `tracing.server` is on, which makes `@opentelemetry/api` a runtime
  dependency: SvelteKit externalizes it from the server bundle, so it has to be
  a direct dependency or the build fails at prerender
- `pnpm build` is `vp build` and nothing else. The migration runs in the
  Vercel build command, `pnpm build && pnpm db:migrate`, set in
  `infra/modules/vercel/main.tf`; a container runs `pnpm db:migrate:run` as a
  separate step (see Deployment)
- Plugins are built inside `lazyPlugins(async () => …)` with dynamic imports,
  so `vp fmt`, `vp lint` and the editor LSPs — which load the config only for
  `fmt` and `lint` — skip them. Keep plugin imports inside that factory
- `build.sourcemap` is stated outright, never `undefined`, which Sentry's
  plugin would silently turn into `"hidden"`: `"hidden"` only when
  `SENTRY_AUTH_TOKEN` is set (uploaded, then deleted via
  `filesToDeleteAfterUpload`), otherwise `false`
- `csp` is **report-only**, `mode: "auto"`. Violations go to Sentry through the
  `csp-endpoint` group `hooks.server.ts` sets per response. mode-watcher's
  theme bootstrap is rendered from `app.html` under `%sveltekit.nonce%`
  (`handleModeWatcher`), because one injected through `<svelte:head>` cannot
  carry the nonce. Learn the list from the reports, then promote it to
  `directives` as its own change. A new third-party origin goes in the list
- **A boundary's `failed` snippet gets the transformed `App.Error`, not what
  was thrown**, so `isHttpError` on it is always `false`, and `status` does not
  tell a deliberate error from a crash either — kit 3 gives every `App.Error`
  one, its own `{ status: 500, message: "Internal Error" }` fallback included.
  `ErrorState.svelte` is the pattern. Nothing types this; a wrong test just
  quietly shows the fallback copy

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
- Anything that needs a session goes through `guarded_command` /
  `guarded_query` / `guarded_batch` / `guarded_form` from
  `src/lib/server/remote/guarded.ts`, not a hand-rolled `get_session()`. The
  pipeline is session → `authorize` → rate `limit`s → `resolve`, each refusal
  returned as an `App.Result`; the handler gets `{ session, user_id }` (level
  `user`) or also `{ org_id, member_id, member_role }` (level `org`, read fresh
  from `member` by `read_session`). Start from `USER`, `ORG` or `ADMIN` and
  spread to add `session: { org_permissions }` or a `limit`
- **A read that a handler or a timer calls is a `command`; a `query` is for
  what a component renders.** A query is a GET with its argument in
  `?payload=`, so a large argument does not belong in one. Its client result is
  cached per argument until the proxy is garbage-collected, so a repeat call in
  that window answers without fetching — a poll, a token refresh or a second
  press can go stale. And every successful `form` submit refreshes each query
  still cached, spending a rate-limit token each. Making a read a query means
  rendering it and calling `.refresh()` where it must be fresh; for a poll,
  reach for `query.live`
- A refusal is returned as an `App.Result`, from queries too — nothing in a
  guarded handler throws `error()`, so a `<svelte:boundary>`'s `failed` only
  sees genuine faults
- Permission questions go through `Authz` (`src/lib/utils/auth/authz.util.ts`),
  pure and shared by server and client; in a component, `can()` from
  `#lib/utils/auth/permission.util.ts` asks it of `page.data.org`, which the
  page's load must return

### State Management

- Svelte 5 runes for reactive state
- Stores in `src/lib/stores/` for shared state (organizations, session)
- Better-Auth client provides session management
- **An effect may read state it writes, but only if it reaches a fixed
  point.** A converging write (`if (n === 0) n = 1`) runs once; `n = n + 1` or
  `xs = [...xs, x]` hits the loop guard and throws
  `effect_update_depth_exceeded` — and **`untrack` does not change that**,
  whatever reading Svelte's source suggests. Measure the shape rather than
  reason about it. The one to look for is a count a caller's effect increments
  (`$effect(() => store.watch())` with `+= 1` / `-= 1` in its cleanup):
  keep the number in a plain field and make only the flag it drives `$state`,
  written just when it flips. `NavigationProgress.svelte` writes `visible` and
  never reads it, which is why it cannot re-run itself
- **Don't use runed's `resource()`.** Through 0.37.1 it keeps its abort-cleanup
  list in `$state` and rewrites it from inside the effect driving it, so it
  loops. runed's `watch` plus a few lines does the same job; runed's other
  utilities are fine
- **The test suite cannot catch an effect loop**, and a green run is not
  evidence: it runs under `environment: "node"`, where Svelte resolves to its
  SSR build, `$effect` never runs and `mount()` throws. Testing reactivity
  needs a project with `environment: "jsdom"` **and**
  `resolve: { conditions: ["browser"] }`, plus a `window.matchMedia` stub.
  Always run the negative control — reintroduce the bug and watch the probe go
  red — because this harness fails silently green

### UI conventions

- **Confirm, never `window.confirm`/`prompt`.** `Confirm.ask(request)` from
  `#lib/stores/confirm.svelte.ts` returns a `Promise<boolean>` answered by the
  one `Confirm.svelte` the root layout mounts. Title is the question ("Delete
  this key?"), the description what follows; `destructive` for the red button,
  `type_to_confirm` for an irreversible action whose size is the point. A
  `Client.wrap` `confirm:` string is split into the two for you
- **Toast, never `toast` from svelte-sonner.** `Toast.success/error/warning/info`
  from `#lib/utils/toast.util.ts` take a string or `{ title, description }`;
  `Toast.err(app_error)` / `Toast.from_error` turn an `App.Error` into one,
  adding a heading only for the codes that name a category. Copy: the title is
  the outcome, sentence case, no full stop, no "successfully"
- **Tip** (`ui/tooltip/Tip.svelte`) is the tooltip: `content`, optional `kbd`
  for a shortcut, and `disabled_trigger` when it explains why a control is
  disabled
- **Header** (`ui/header/Header.svelte`) is every page's heading: it names the
  browser tab (`X · <app name>`; pass `head_title` when `title` is a snippet),
  takes `back` as one link or a breadcrumb, and `level` 2–4 for a section
  header inside a page. On `(authed)` pages it is the only source of the
  title — `SEO.svelte` emits none there, and marks them `noindex`
- **NavigationProgress** in the root layout shows a bar on a navigation slower
  than 150ms — every `load`, including a server-paged table's filter or page
  change. Nothing per page needs to opt in

### Service Pattern

Services live in `src/lib/server/services/` as plain objects of async methods
that return `App.Result` rather than throw. There is no DI container: an
implementation is picked at module load.

- **Email Service** (`src/lib/server/services/email.service.ts`):
  - `EmailService` is `of_resend` (Resend, with a Sentry timing metric) in
    production and `of_console_log` (logs the message) under `dev`
  - Both answer `App.Result`, so a caller checks `.ok` the same way in either
  - Used by `auth.ts` for verification emails, password resets and org
    invites, and by the contact form
- **Shared tails** (`service.util.ts`): `ServiceUtil.internal` logs, files to
  Sentry and answers 500; `ServiceUtil.ba_error` relays a Better-Auth
  `APIError` with its own status, filing it to Sentry only when it is a 5xx

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
- A deliberate violation gets an inline `// oxlint-disable-next-line <rule>`
  with a reason, not a rule downgrade. The directive must be the **last comment
  line before the reported line** — a `--` description does not continue onto
  a following comment line, and the reported line is not always the
  statement's first line. `--report-unused-disable-directives` fails a stale one
- There is **no ESLint**. `eslint-plugin-svelte` was removed: oxlint only hands
  JS plugins the extracted `<script>` AST, never the template, so a quarter of
  that plugin's rules hard-gate off and the rest found nothing. Svelte
  correctness comes from `pnpm check`.

**Adding to the ratchet after an oxlint upgrade.** Promoting a category and
tallying reports many rules as clean and unpinned, but most are already
enforced by an enabled category. Get the category membership too:

```sh
# per-rule counts with every off-category promoted
vp lint -W style -W pedantic -W restriction -W nursery -f json > all.json
# which category each rule belongs to; --print-config does no linting
for c in pedantic style restriction nursery correctness suspicious perf; do
  vp lint -A all -A nursery -W $c --print-config > cat-$c.json
done
```

A rule is a candidate only if it is clean AND in one of the four
off-categories. Then check the three axes a tally misses: **re-measure the
`off` entries** (they carry their counts), **try a rule's options before
rejecting it**, and **check whether findings cluster in one directory** (then
it goes on globally with a scoped override). Option shapes are in
`node_modules/.pnpm/oxlint@*/node_modules/oxlint/configuration_schema.json`
under `definitions.DummyRuleMap.properties`; read the whole tuple. `--fix`
output is unformatted, so follow it with `vp fmt`. Rules taking a
three-element tuple (`eqeqeq`, `curly`, …) cannot be given options until
vite-plus 1.0, whose config bridge stops mangling them.

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

Zed needs the `oxc` extension (`oxc-project/oxc-zed`). vite-plus 1.0 deleted
the `vite-plus/bin/{oxfmt,oxlint}` wrappers that oxc-zed ≤ 0.4.7 launches, so
`.zed/settings.json` pins each server to `vp fmt --lsp` / `vp lint --lsp`
through `lsp.*.binary` until an extension release runs `vp` itself — the
comment there says when to drop it. Keep `source.organizeImports` out of
`code_actions_on_format`: Zed runs code actions before the formatter under one
save timeout, and svelte-language-server's first organize-imports answer on a
`.svelte` buffer outlasts it.

### TypeScript version

`typescript` is pinned and the editor stays on it with classic tsserver:
**tsgo does not support TSServer plugins**, and the Svelte TS plugin is what
types `./Foo.svelte` imports inside `.ts` files. tsgo is still used where it
pays — `pnpm check` (svelte-check `--tsgo`) and `pnpm lint` (tsgolint).
`@typescript/native` is that TS 7, and its alias name is load-bearing:
svelte-check probes for it by that exact string. `check:scripts` runs its `tsc`
by path, because a bare `tsc` resolves to whichever package won the bin
collision at install and silently degrades to TS 6.

The root `tsconfig.json` adds `noFallthroughCasesInSwitch`,
`noImplicitReturns`, `noUncheckedSideEffectImports`, `allowUnreachableCode:
false` and `allowUnusedLabels: false`, all measured at zero findings when
switched on. `erasableSyntaxOnly` is deliberately only in
`tsconfig.scripts.json`: at the root it would flag the house-style value
`namespace`s in `src/`.

### Git hooks

Vite+ owns them: `vp config`, which `prepare` runs on every install, installs
a dispatcher into `.vite-hooks/_/` and points `core.hooksPath` at it. The hooks
are the two committed files one level up:

- **`pre-commit`** runs `vp staged`, which runs `vp check --fix` over staged
  files: format, then lint, then type-check.
- **`pre-push`** runs `pnpm test:run` then `pnpm check`, but only for a push to
  `main` that carries more than markdown — a branch's gate is its pull request.
  Whenever it cannot tell what a push contains, it runs anyway.

Both are skippable (`--no-verify`, `VP_GIT_HOOKS=0`), so neither is the last
line of defence.

### CI

`.github/workflows/ci.yml`, on every pull request and push to `main`, needs no
secrets. `verify`: install, fail on a drifted generated file
(`git diff --exit-code`), `cp .env.example .env` (the static `APP_ENV` and
`PUBLIC_*` must exist for Vite to load the config at all), `env:check`,
`vp check`, `pnpm check`, `test:run`, `auth:check`, `knip:ci`, then
`pnpm build` and booting the built server — the only check of the
adapter-node path. `secrets`: trufflehog over the commit range, verified
results only. Node comes from `.nvmrc`.

Dependencies resolve only once published for 24h (`minimumReleaseAge` in
`pnpm-workspace.yaml`). `vitest` and `@vitest/*` are catalog-pinned to the copy
vite-plus bundles (`vp toolchain vitest`); a second copy would split mocks and
`expect` state.

## Environment Setup

1. Install the Node version required by `engines` in `package.json`
2. Install the pnpm version pinned in `packageManager` in `package.json`
3. Create `.env` file based on `.env.example`, which lists every variable the
   app reads. `src/env.ts` declares the same set — `$app/env/*` exposes
   nothing undeclared — and `src/test/env.test.ts` fails if the two differ, so
   they cannot quietly drift
4. Set up PostgreSQL database (Neon recommended) with development branch
5. Add `DATABASE_URL` to `.env`
6. Configure Redis with `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
   (for Better-Auth session storage, rate limiting and caching), and set
   `APP_ENV` — it namespaces every Redis key and the build fails without it
7. Run `pnpm install` to install dependencies
8. Run `pnpm db:push` to create tables
9. Configure auth provider credentials as needed (Google, Pocket ID)
10. Configure email service (Resend) with `RESEND_API_KEY` and `EMAIL_FROM`
11. Optional kits: R2 (invoice PDFs), Cloudinary (image upload) and OpenAI
    (moderation) may stay unset; their services answer "not configured", and
    moderation fails closed, refusing custom avatars and uploads

## Deployment

Vercel is the default target and the only one wired up end to end. The app is
not _bound_ to it, though: nothing in `src/` reads a `VERCEL_*` variable, and
`pnpm build` with no `VERCEL` in the environment produces a standalone Node
server in `build/`.

### Vercel

1. Connect the repository to Vercel.
2. Run `tofu apply` in `infra/`. **Environment variables are managed by
   OpenTofu, not the dashboard** — `infra/app_env.tf` is the sole writer, so
   anything set by hand there is overwritten on the next apply.
3. Create `.env.production` for the production database URL (used by
   `pnpm db:generate` and `pnpm db:check`).
4. The build command is set by `infra/modules/vercel/main.tf` and is
   `pnpm build && pnpm db:migrate`.

### Container

`pnpm build` → `build/`, started with `node build`. The `Dockerfile` builds on
a Debian-slim base (not Alpine — `sharp` ships glibc prebuilts), installs
`--prod` dependencies in a separate stage, and ships a runtime stage with no
pnpm in it. adapter-node bundles everything except `dependencies`, so a package
the server imports at run time must be a dependency, not a devDependency —
check the bare specifiers under `build/` before moving one. `compose.yaml`
runs the image locally against `.env` and waits on `/api/health`.

Build args are the build-time variables only: `APP_ENV` and the `PUBLIC_*` set.
Everything else is read at runtime through `$app/env/private`, so **no
secret ends up in an image layer** — and the image is per-origin, not per-tier,
because `PUBLIC_BASE_URL` is compiled into the client bundle. It is also the
origin SvelteKit trusts for CSRF checks: `adapter-node` 6 dropped the runtime
`ORIGIN` variable, so `vite.config.ts` sets `paths.origin` from
`PUBLIC_BASE_URL` at build time instead. A runtime `ORIGIN` is now ignored.

`adapter-node` needs these at run time, beyond the app's own variables:

| Var                            | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADDRESS_HEADER` + `XFF_DEPTH` | `event.getClientAddress()` otherwise returns the socket peer — the reverse proxy — for every request, which collapses all users into one rate-limit bucket. `XFF_DEPTH` is the real number of trusted proxies. Do not "fix" this by reordering the header chain in `adapter.service.ts`: that lets any client spoof its own IP. It feeds Better-Auth too: `handle` pins the resolved address onto `x-app-client-ip` (`AdapterService.pin_client_ip`), the only header `advanced.ipAddress` reads, so its rate limiter keys on the same address. |
| `PORT` / `HOST`                | Default `0.0.0.0:3000`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `BODY_SIZE_LIMIT`              | Default 512kb, which image uploads exceed. The image sets `6M`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `SHUTDOWN_TIMEOUT`             | Seconds to close connections before `sveltekit:shutdown` starts the background-work drain (up to 30s more). The image sets 20, so the stop grace period must exceed 50s — docker's default is 10.                                                                                                                                                                                                                                                                                                                                               |

Run `pnpm db:migrate:run` as a separate one-shot step before rolling out, not
from the entrypoint. The runtime image has no pnpm, so there it is
`node scripts/db/migrate.script.ts` (or `docker compose run --rm migrate`).

### Health and shutdown

- `GET /api/health` is the readiness probe: `200` when Postgres and Redis
  answer, `503` with per-dependency detail when not. Unauthenticated, not
  rate-limited, `no-store`, and dropped from Sentry tracing. The compose
  healthcheck and any orchestrator probe point here
- Work that outlives a response goes through `RuntimeService.defer(work)`,
  never a bare un-awaited promise: on Vercel it becomes `waitUntil`; on Node it
  is supervised (an unhandled rejection would take the server down) and
  tracked, and `sveltekit:shutdown` drains it for up to 30s before exit. So a
  container's stop grace period must exceed `SHUTDOWN_TIMEOUT` plus that

### The platform seam

`src/lib/server/services/adapter/adapter.service.ts` is the only file allowed to
touch host-specific APIs — client IP, coarse geo, and scheduling work that
outlives the response. Keep it that way: it is what makes the two targets a
config switch instead of a port.

### Tiers

Each tier has its own database, bucket and Redis keyspace:

|             | Database              | Object storage | Redis                   |
| ----------- | --------------------- | -------------- | ----------------------- |
| production  | Neon default branch   | prod bucket    | `<APP.ID>:production:`  |
| preview     | Neon `preview` branch | dev bucket     | `<APP.ID>:preview:`     |
| development | Neon `dev` branch     | dev bucket     | `<APP.ID>:development:` |

The Redis column is `<APP.ID>:<APP_ENV>:`, and `APP_ENV` holds exactly those
three strings.

Preview having its own database is **not cosmetic**: the build command runs
`pnpm db:migrate`, so a preview tier pointed at production would migrate the
production database on every pull request. That was a live bug in this template
until `infra/neon.tf` grew a branch per tier.

Redis is the exception — one shared instance, separated only by the key prefix
that `src/lib/server/db/redis.db.ts` builds from `APP.ID` and `APP_ENV`.
There is no infrastructure-layer fallback there, so that prefix is load-bearing.

`APP_ENV` was `VERCEL_ENV` until it was renamed to mean something off Vercel
too. The three _values_ were kept byte-identical precisely so the prefix string
did not change — renaming them would have orphaned every session and
rate-limit bucket on a shared, `eviction = false` instance. It is the one
private variable declared `static` in `src/env.ts`, so a missing value fails the
build instead of silently merging two tiers' keyspaces.

Note that `pnpm db:migrate` running inside the build means a push to `main`
migrates production with no review gate between merge and schema change.

## Key Patterns and Conventions

### Comments

A comment says what the code does now and why — the invariant it keeps, the
race it accepts, the vendor quirk it works around — in a line or two. It does
not narrate earlier designs (that is git history), restate a name, or repeat
this file. When trimming comments, strip them from both versions and check the
code is unchanged, and keep every tool directive (`oxlint-disable…`).

### Code Organization

- **Naming conventions**:
  - Database schema files: `*.model.ts`
  - Remote functions: `*.remote.ts`
  - Services: `*.service.ts`
  - Utilities: `*.util.ts`
- **Import aliases**: `#lib/...` for `src/lib`, a `package.json` subpath import
  that replaced `$lib` in SvelteKit 3. Imports carry an extension:
  `#lib/utils/result.util.js` (`.js` for a `.ts` file) and
  `#lib/components/ui/button/button.svelte`. `tsconfig.json` restates it under
  `paths`, which `svelte-check --tsgo` needs to type `.svelte` imports
- **Environment variables**: declare every one in `src/env.ts` and import it
  from `$app/env/private` or `$app/env/public`; `$env/*` and
  `$app/environment` are deprecated (use `$app/env` for `dev`/`browser`/
  `building`). See "Reading environment variables" below
- **TypeScript namespaces**: Preferred for organizing related types (e.g., `IAuth.ProviderId`)

### Reading environment variables

**One declaration: `src/env.ts`.** It is SvelteKit 3's explicit environment
entry and covers both halves — private and `PUBLIC_*` — as one
`defineEnvVars({...})` object. Each entry has a `description`, which kit
renders as the hover documentation at every import, and a zod `schema`, which
kit runs at build time and at boot. `pnpm env:check` and the hygiene block in
`src/test/env.test.ts` fail an entry missing either, or a `PUBLIC_` name whose
`public` flag disagrees.

**`required()` vs `optional()` is the main dial.**

- `required(description, placeholder?)`: unset or `""` fails the build and the
  boot, at a moment someone is watching rather than inside the first request
  that reads it. `placeholder` is a well-formed stand-in for tools that need
  _a_ value — the test env mock and `pnpm auth:check` — so give one whenever a
  module parses the value at load (`new URL(PUBLIC_BASE_URL)`, a connection
  string). It is never used at build or run time.
- `optional(description)`: unset and `""` both arrive as `undefined`, so the
  export types as `string | undefined` and the compiler makes you write the
  "not configured" branch. Use it only when the app genuinely runs without the
  value (the OAuth providers, Umami, Sentry). Never give one a placeholder value
  in a real environment: a non-empty `"TODO"` satisfies every `if (X)` guard.
- Anything else takes a plain zod schema with a default — `LOG_LEVEL` is an
  enum defaulting to `info`.

**Static vs dynamic.** `APP_ENV` and the `PUBLIC_*` set are `static: true`:
inlined at build time, so they are build args, not runtime config (see
Deployment → Container). Everything else is dynamic — read from the
environment when the server starts. A secret must never be static: it would
be compiled into the bundle.

**The ordering trap.** A dynamic export of `$app/env/*` is a `const`
snapshotted when `set_env()` fills it during `Server.init()`.
`src/instrumentation.server.ts` is evaluated _before_ that, so anything
reachable from it that reads a dynamic variable at module scope captures
`undefined` **permanently** — not a throw, a silent wrong value on a process
that then serves requests. `logger.util.ts` (`LOG_LEVEL`), `drizzle.db.ts`
(`DATABASE_URL`) and the SDK clients all read at module scope. That file's
import list is therefore a correctness constraint: **statically import only
static variables there** — `APP_ENV` and `PUBLIC_SENTRY_DSN` are safe because
they are inlined at build time — and import anything else dynamically, inside
the function that needs it, as the shutdown drain does. `hooks.server.ts` and
everything it imports run after `set_env`.

### Database Patterns

- All tables use UUID primary keys via `Schema.id()` from `index.schema.ts`
- Timestamps use `Schema.timestamps` helper (createdAt, updatedAt)
- Database columns in `snake_case`, TypeScript in `camelCase` — produced by
  declaring tables with `snakeCase.table(...)`
- **Reads use the relational `{}` syntax**, `db.query.x.findMany({ columns,
where, with, orderBy, limit })`, not the `db.select().from()` builder. A
  `where` is an object (`{ userId, status: { in: [...] }, OR: [...] }`);
  `undefined` keys are skipped and `in: []` compiles to `false`, so no
  `xs.length ? … : undefined` guards. A join is a `with`, a computed column an
  `extras`. Two traps: `findMany` aliases the table, so an `orderBy` or
  `extras` callback must use the table it is handed, never the imported
  `XTable`; and `db.$count` still takes SQL, so give it the same object through
  `filter_sql(table, where)` (`sql.util.ts`), typed as `TableFilter<typeof
XTable>`. Writes (`insert`/`update`/`delete`) have no object form and stay
  on the builder
- Wrap every statement in a `Repo.*` helper so failures become `App.Result`
  rather than throwing; use `Repo.contains()` for any LIKE/ILIKE search term,
  which escapes the wildcards
- **No per-table repos.** A query is written inline where it is used — the
  service, `load` or remote function — with `columns:` / `select({…})` naming
  what that use reads. Tests drive it through the mocked `Repo.*`
- **Extract a query only on evidence**: two or more real callers, or an
  invariant it must keep. It is named for the question, not the table
  (`MembershipQuery.for_user`, not `OrganizationRepo.get_by_id`), lives in a
  `*.query.ts` beside the feature, and gets a `*.query.test.ts` in the `sql`
  project. Back to inline when it is down to one caller
- **An extracted query takes its caller's `columns`** (`{ id: true, role:
true }`) and answers exactly that row: `Columns`, `NonEmpty`, `Projected`
  and `Every` from `src/lib/server/db/projection.ts`, with `membership.query.ts`
  as the pattern. `{}` is refused, since drizzle reads it as every column.
  Mocking one, `vi.mocked` erases the generic to a whole row, so narrow the
  mock's type to the projection the code under test asks for
- Never use BetterAuth's nanoid generation; custom UUID generation is configured

### Error Handling

- Use `result.err(...)` for consistent error responses, with an `ERROR.*`
  constant or `{ status, message }`. `App.Error.status` is required since
  SvelteKit 3, so a bare `{ message }` no longer type-checks
- Throw a refused result as kit's error with `raise(res.error)` from
  `#lib/utils/result.util.js` — `if (!res.ok) raise(res.error);` — which keeps
  its status and properties and narrows `res` afterwards
- `handleError` in `hooks.server.ts` receives every error in SvelteKit 3 —
  expected `error(...)`s, 404s and remote-function validation failures, told
  apart by `kind` — and replaces the removed `handleValidationError`
- An `/api/*` error kit would render as HTML (a missing endpoint, a missing
  verb) is rewritten to `{ error: { code, message } }` by
  `handleApiErrorShape`, innermost in `hooks.server.ts`; a route's own JSON
  error passes through
- Log errors with context: `Log.error(error, "context_identifier")`
- Better-Auth API errors are instances of `APIError` with `body.code` for error types
- Custom error codes defined in `#lib/auth-client.ts` as `$ERROR_CODES`

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
