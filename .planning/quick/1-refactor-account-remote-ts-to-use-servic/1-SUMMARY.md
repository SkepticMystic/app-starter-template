---
phase: quick-1
plan: 1
subsystem: auth/account
tags: [refactor, service-layer, account, auth]
dependency_graph:
  requires: []
  provides: [AccountService.list, AccountService.unlink]
  affects: [src/lib/remote/auth/account.remote.ts]
tech_stack:
  added: []
  patterns: [ServiceClass object-literal, thin-adapter-remote]
key_files:
  created:
    - src/lib/server/services/auth/account/account.service.ts
  modified:
    - src/lib/remote/auth/account.remote.ts
decisions:
  - "Kept cache invalidation in account.remote.ts (not in AccountService) to maintain remote-layer responsibility for cache side effects"
  - "Did not move get_account_by_provider_id_remote to service — it's a DB-layer query.batch with no auth.api call, fits fine as a remote"
metrics:
  duration: "~5 minutes"
  completed: "2026-03-07"
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 1: Refactor account.remote.ts to Use AccountService

**One-liner:** Extracted auth.api account logic into AccountService (list + unlink) following the canonical ServiceClass pattern, leaving account.remote.ts as a thin session-check + delegation adapter.

## Tasks Completed

| Task | Name                        | Commit    | Files                                                               |
| ---- | --------------------------- | --------- | ------------------------------------------------------------------- |
| 1    | Create AccountService       | `2f4b20b` | `src/lib/server/services/auth/account/account.service.ts` (created) |
| 2    | Slim down account.remote.ts | `d92cc47` | `src/lib/remote/auth/account.remote.ts` (refactored)                |

## What Was Built

### AccountService (`account.service.ts`)

- Follows exact canonical pattern from `apikey.service.ts`
- `list(_session)`: Calls `auth.api.listUserAccounts`, returns typed result
- `unlink(input, _session)`: Calls `auth.api.unlinkAccount`, handles `FAILED_TO_UNLINK_LAST_ACCOUNT` error with `path: ["providerId"]`
- Proper try/catch with `APIError` detection, `captureException`, and `result.from_ba_error`/`result.err` returns

### account.remote.ts (refactored)

- `list_accounts_remote`: session check → `AccountService.list(session.data)` — removed 20+ lines of try/catch
- `unlink_account_remote`: session check → `AccountService.unlink(input, session.data)` → cache invalidation on success
- `get_account_by_provider_id_remote`: untouched (DB-layer `query.batch`)
- Removed unused imports: `auth`, `is_ba_error_code`, `Log`, `result`, `captureException`, `APIError`, `getRequestEvent`, `ERROR`

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `pnpm check` confirms 0 new errors introduced (65 pre-existing errors in unrelated files, same count as before)
- Both files compile cleanly
- Cache invalidation (`get_account_by_provider_id_remote(input.providerId).set(undefined)`) still fires on successful unlink
- No try/catch blocks remain in account.remote.ts

## Self-Check: PASSED

- `src/lib/server/services/auth/account/account.service.ts` — ✅ exists
- `src/lib/remote/auth/account.remote.ts` — ✅ thin adapter, no try/catch, no auth.api calls
- Commits `2f4b20b` and `d92cc47` — ✅ exist in git log
