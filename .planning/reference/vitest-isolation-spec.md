> **Reference, copied from the call-center project.** Not a plan for this
> repo — kept here because the method is reusable and the measurements were
> expensive to make. Statuses below describe call-center, not this template.

# Spec: turning off vitest isolation

## Context

`vite.config.ts` runs the suite with vitest's default `isolate: true` — every test file gets
its own module registry. Turning it off is worth about **a third of the wall clock**, measured
back to back on this machine with the repo tests already removed:

| Run                | Duration | Result                      |
| ------------------ | -------- | --------------------------- |
| `isolate: true`    | 28.2s    | 119 files, 2615 tests pass  |
| `isolate: true`    | 22.6s    | pass                        |
| `--no-isolate`     | 15.6s    | **1 file, 12 tests failed** |
| `--no-isolate`     | 14.8s    | pass                        |

Those last two runs are the same command on the same tree. That is the whole problem: the
suite under `--no-isolate` does not fail *reliably*, it fails *sometimes*, depending on how
vitest happens to distribute files across workers. Forcing every file into one registry with
`--no-isolate --maxWorkers=1` turns the coin-flip into a consistent **7 files / 96 tests**.

The received explanation has been "a small fraction of mocks disagree" — that different files
mock the same module with different shapes. That is true of a handful of them, but it is not
the mechanism, and fixing the shapes would not have worked. There are two mechanisms, both
confirmed by probe rather than inferred.

## Mechanism 1 — a shared registry evaluates each module once

With `isolate: false` the files in a worker share one module registry, so an app module is
evaluated **once per worker**. A `vi.mock` in file B cannot retroactively change what file A's
already-evaluated import graph is bound to.

Nearly every service test writes its mocks like this:

```ts
const { mock_credit } = vi.hoisted(() => ({ mock_credit: { preflight: vi.fn() } }));
vi.mock("$lib/server/services/credit/credit.service", () => ({ CreditService: mock_credit }));
```

The factory closes over a **file-local** object. Two files doing that for the same module
install two different objects, and whichever file ran first is the one the service under test
is wired to. The second file then spends its whole run configuring an object nobody consults —
`expect(mock).toHaveBeenCalled()` fails, or the service reads `undefined` off a result it
believed was stubbed. Which file wins is scheduling order, which is why the failure set moves
between runs.

This is already documented in two places in the tree, discovered the hard way and solved
locally: the header of `src/test/env.mock.ts` ("what stopped the suite from running with
`isolate: false`") and `requestEventMocker` in `src/test/helpers.ts` ("any future helper here
that wants a mocked module has to do the same"). Both fixes are the right shape. They were
just applied to two modules out of sixty.

### Inventory

60 distinct modules are mocked across the suite. Grouped by what makes them hard:

- **25** are mocked by two or more files, each with its own factory — `call.repo` by 11 files,
  `contact.repo` by 6, `campaign_contact.repo` by 5, `twilio.client` by 4.
- **32** are mocked by some file *and* have a test of their own, so they need to be the mock
  in one place and the real module in another.
- **33** are mocked by exactly one file. These look safe and are not: the mock still leaks
  into every other file in the worker, it simply has no rival to disagree with.

## Mechanism 2 — a setup-file mock is re-registered per test file

This is the one that makes "just move the mocks into `setup.ts`" insufficient on its own, and
it is worth being precise about because it is counter-intuitive.

`setupFiles` re-run before **every** test file, even with `isolate: false`. Each re-run
re-registers the `vi.mock` and **rebuilds its factory's result**, including re-evaluating the
modules the factory imports. Meanwhile the app modules from earlier files stay cached. So:

```
file a: direct import id=i6z99g   consumer's binding id=i6z99g
file b: direct import id=pqxqzx   consumer's binding id=i6z99g
```

File b's test imports a **fresh** mock instance, while the consumer module — evaluated back in
file a — is still holding file a's. A global mock, and still two instances.

This is not specific to automocking. The same probe against the existing
`$env/dynamic/private` mock, whose factory returns the module-level `dynamic_env` object from
`env.mock.ts`, gives two different ids across two files. That object is stable *within* a
file, which is all `isolate: true` ever required of it.

`globalThis` is the one thing that survives, since it is per worker process rather than per
registry:

```ts
vi.mock("$lib/server/services/slack.service", () => {
  const g = globalThis as Record<string, unknown>;
  g.__mock_slack ??= { notify: vi.fn() };
  return { SlackService: g.__mock_slack };
});
```

```
file a: SlackService id=v1ey6o
file b: SlackService id=v1ey6o
```

## The rule

> **Every mocked module has exactly one `vi.mock`, it lives in `src/test/setup.ts`, and its
> factory returns an instance memoised on `globalThis`.**

Three supporting facts, each confirmed by probe:

1. **`vi.importActual` bypasses the mock for the named module while leaving its dependencies
   mocked.** This is what resolves the 32 modules that are both mocked and tested — a
   service's own test asks for the real service and still gets mocked repos underneath it:

   ```ts
   const { CreditService } = await vi.importActual<typeof import("./credit.service")>(
     "./credit.service",
   );
   ```

2. **A bare `vi.mock(path)` with no factory automocks the module**, and for these namespace
   objects it produces the union of the *real* methods as `vi.fn()`s:

   ```
   CreditRepo keys = apply_movement,get_balance,grant,settle_topup,list_grants,list_accounts,reconcile
   get_balance is vi.fn? = true
   ```

   That deletes roughly fifty hand-written factories along with their drift — two files
   currently mock `credit.repo` listing different four- and two-method subsets of it. The
   automock is *not* memoised, so it still has to be wrapped per the rule above.

3. **`vi.mock` is hoisted out of enclosing blocks**, so `for (const p of PATHS) vi.mock(p, …)`
   fails with `ReferenceError: p is not defined`. The list in `setup.ts` has to be sixty
   literal calls, not a loop.

Then a test configures the one instance it shares with everything else through a normal
import, and file-local `vi.hoisted` disappears:

```ts
import { CreditRepo } from "$lib/server/db/repos/credit.repo";
const repo = CreditRepo as Mocked<typeof CreditRepo>;
```

`setup.ts` also grows a `beforeEach` that resets and re-seeds every mock it owns, so that the
`vi.resetAllMocks()` in `contact.service.test.ts` and six others — which under a shared
registry reaches every mock in the worker, not just that file's — cannot strand one.

## Done

The ten `src/lib/server/db/repos/*.repo.test.ts` files and `src/test/recording_db.ts` are
deleted (173 tests). They asserted on the SQL string a repo emits, which mostly restates the
repo, and they were also the sharpest instance of Mechanism 1: all ten inverted **both**
global db mocks, needing `drizzle.db` to be a real drizzle over a recording client and
`index.repo` to be the real wrappers where every service test needs both stubbed. That is the
same module holding two different values, which one registry cannot do — it would have forced
a second vitest project.

Two of the ten carried a claim that was not merely circular, and it is now unasserted:
`report.repo.test.ts` pinned `org_id` into the `WHERE` of every aggregate (a dropped tenant
predicate does not fail, it returns a larger plausible number), and `credit.repo.test.ts`
pinned each balance movement as a single data-modifying CTE (the Neon HTTP driver has no
interactive transaction, so a debit split into a second statement can be lost while the
`usage_event` it pays for stands). If either is worth keeping, it wants an integration test
against a real database rather than a string assertion.

Deleting them did not unlock `isolate: false` on its own — it moved the single-worker failure
from 12 files / 163 tests to 7 files / 96 tests.

## Remaining work

1. `setup.ts`: sixty literal `vi.mock` calls, each memoised on `globalThis`; a
   `beforeEach` that resets and re-seeds them.
2. The ~50 test files that carry a `vi.mock`: delete the factory and the `vi.hoisted`, import
   the module normally, and switch the subject under test to `vi.importActual` where the
   subject is itself globally mocked.
3. `cache.db.test.ts` keeps its in-memory Redis, but installs it as *implementations* on the
   global `redis` mock fns in its own `beforeEach` rather than re-mocking the module.
4. `isolate: false` in the project config, with the rule written above it as the reason.
5. Delete `mockDbModule` and `mockDbChain` from `src/test/helpers.ts` — both have zero callers
   today.
6. Verify with `--no-isolate --maxWorkers=1`, which is the only configuration that reliably
   exercises the shared registry. A green multi-worker `--no-isolate` run proves nothing.

The ordering matters: 1 and 2 have to land together per module, since the global mock and the
per-file mock cannot both exist. Doing it a cluster at a time (credit, then event, then call)
keeps the suite green throughout — a cluster was converted this way while investigating, and
the pattern held.
