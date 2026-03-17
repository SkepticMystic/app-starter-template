---
phase: quick-1
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/server/services/auth/account/account.service.ts
  - src/lib/remote/auth/account.remote.ts
autonomous: true
requirements:
  - REFACTOR-ACCOUNT-REMOTE
must_haves:
  truths:
    - "AccountService encapsulates all account business logic (list, unlink)"
    - "account.remote.ts is a thin adapter: session check → delegate to AccountService"
    - "Type checking passes with no new errors"
  artifacts:
    - path: "src/lib/server/services/auth/account/account.service.ts"
      provides: "AccountService with list and unlink methods"
      exports: ["AccountService"]
    - path: "src/lib/remote/auth/account.remote.ts"
      provides: "Thin remote adapters delegating to AccountService"
  key_links:
    - from: "src/lib/remote/auth/account.remote.ts"
      to: "src/lib/server/services/auth/account/account.service.ts"
      via: "import AccountService"
      pattern: "AccountService\\.(list|unlink)"
---

<objective>
Extract business logic from account.remote.ts into a new AccountService following the canonical ServiceClass object-literal pattern, then slim account.remote.ts down to thin session-check adapters.

Purpose: Consistent layering — remotes are I/O adapters, services own business logic.
Output: New account.service.ts + refactored account.remote.ts
</objective>

<execution_context>
@/home/ross/.config/Claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@src/lib/server/services/auth/apikey/apikey.service.ts
@src/lib/remote/tasks/tasks.remote.ts
@src/lib/remote/auth/account.remote.ts

<interfaces>
<!-- Canonical ServiceClass pattern (from apikey.service.ts) -->
```typescript
const log = Log.child({ service: 'ServiceName' });

const methodName = async (input: InputType, session: App.Session): Promise<App.Result<T>> => {
const l = log.child({ method: 'methodName' });
try {
// business logic using auth.api.\*({ headers: getRequestEvent().request.headers })
return result.suc(data);
} catch (error) {
if (error instanceof APIError) {
l.info(error.body, 'error better-auth');
captureException(error);
return result.from_ba_error(error);
} else {
l.error(error, 'error unknown');
captureException(error);
return result.err({ ...ERROR.INTERNAL_SERVER_ERROR, message: '...' });
}
}
};

export const XxxService = { methodName };

````

<!-- Thin remote adapter pattern (from tasks.remote.ts) -->
```typescript
export const some_remote = command(schema, async (input) => {
  const session = await get_session();
  if (!session.ok) return session;
  return SomeService.method(input, session.data);
});
````

<!-- Current account.remote.ts exports -->

// get_account_by_provider_id_remote — query.batch, fetches accounts from DB via Repo
// list_accounts_remote — query, calls auth.api.listUserAccounts
// unlink_account_remote — command, calls auth.api.unlinkAccount + cache invalidation
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create AccountService</name>
  <files>src/lib/server/services/auth/account/account.service.ts</files>
  <action>
Create `src/lib/server/services/auth/account/account.service.ts` following the exact pattern in `apikey.service.ts`:

```typescript
import { getRequestEvent } from "$app/server";
import { auth, is_ba_error_code } from "$lib/auth";
import { AUTH } from "$lib/const/auth/auth.const";
import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";

const log = Log.child({ service: "Account" });
```

Implement two private const functions, then export as `AccountService`:

**`list`** (`_session: App.Session`): Calls `auth.api.listUserAccounts({ headers: getRequestEvent().request.headers })`. Returns `App.Result<Awaited<ReturnType<typeof auth.api.listUserAccounts>>>`. Error handling: APIError → `result.from_ba_error(error)`, else → `result.err({ ...ERROR.INTERNAL_SERVER_ERROR, message: "Failed to get accounts" })`. Log prefix: `"error better-auth"` / `"error unknown"`. Extract current log calls from `list_accounts_remote` as reference.

**`unlink`** (`input: { accountId?: string; providerId: (typeof AUTH.PROVIDERS.IDS)[number] }`, `_session: App.Session`): Calls `auth.api.unlinkAccount({ headers: ..., body: { accountId: input.accountId, providerId: input.providerId } })`. On `res.status` truthy → `result.suc()`, else → `result.err({ message: "Failed to unlink account" })`. Error handling: check `is_ba_error_code(error, "FAILED_TO_UNLINK_LAST_ACCOUNT")` → `result.from_ba_error(error, { path: ["providerId"] })`, else → captureException + `result.from_ba_error(error)`. Unknown errors → `result.err(ERROR.INTERNAL_SERVER_ERROR)`. Extract current logic verbatim from `unlink_account_remote`.

Do NOT move `get_account_by_provider_id_remote` (the `query.batch`) into the service — it is a DB-layer query with no auth.api call and is fine staying in the remote file as-is.

Export: `export const AccountService = { list, unlink };`
</action>
<verify>
<automated>pnpm check 2>&1 | grep -E "(account\.service|Error)" | head -20</automated>
</verify>
<done>account.service.ts exists and exports AccountService with list and unlink; pnpm check reports no errors in the new file</done>
</task>

<task type="auto">
  <name>Task 2: Slim down account.remote.ts</name>
  <files>src/lib/remote/auth/account.remote.ts</files>
  <action>
Rewrite `account.remote.ts` as a thin adapter. Remove all business logic that now lives in AccountService. Keep `get_account_by_provider_id_remote` exactly as-is (it uses Repo directly, no auth.api).

New structure:

```typescript
import { command, query } from "$app/server";
import { AUTH } from "$lib/const/auth/auth.const";
import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { get_session } from "$lib/server/services/auth.service";
import { AccountService } from "$lib/server/services/auth/account/account.service";
import { error } from "@sveltejs/kit";
import { z } from "zod";

// keep get_account_by_provider_id_remote unchanged

export const list_accounts_remote = query(async () => {
  const session = await get_session();
  if (!session.ok) return session;
  return AccountService.list(session.data);
});

export const unlink_account_remote = command(
  z.object({
    accountId: z.string().optional(),
    providerId: z.enum(AUTH.PROVIDERS.IDS),
  }),
  async (input) => {
    const session = await get_session();
    if (!session.ok) return session;

    const res = await AccountService.unlink(input, session.data);

    if (res.ok) {
      get_account_by_provider_id_remote(input.providerId).set(undefined);
    }

    return res;
  },
);
```

Remove unused imports: `auth`, `is_ba_error_code`, `Log`, `result`, `captureException`, `APIError`, `getRequestEvent`, and `ERROR` (if no longer needed). Keep only what the thin adapter actually uses.
</action>
<verify>
<automated>pnpm check 2>&1 | tail -5</automated>
</verify>
<done>account.remote.ts delegates to AccountService for list and unlink; pnpm check passes with no errors; cache invalidation still occurs after successful unlink</done>
</task>

</tasks>

<verification>
Run full type check to confirm no regressions:

```bash
pnpm check
```

Expected: 0 errors. Both files should compile cleanly. The `get_account_by_provider_id_remote` batch query is untouched and still works.
</verification>

<success_criteria>

- `src/lib/server/services/auth/account/account.service.ts` exists with `AccountService.list` and `AccountService.unlink`
- `account.remote.ts` contains no try/catch blocks or auth.api calls — only session checks + AccountService delegation
- Cache invalidation (`get_account_by_provider_id_remote(...).set(undefined)`) still fires on successful unlink
- `pnpm check` passes with no new errors
  </success_criteria>

<output>
No SUMMARY required for quick tasks.
</output>
