> **Reference, copied from the call-center project.** Not a plan for this
> repo — kept here because the method is reusable and the measurements were
> expensive to make. Statuses below describe call-center, not this template.

# Spec: oxlint ratchet — third pass

> **Landed** 2026-09-10 in `bcdacf7`, `68467f5`, `35675ef`, `c9ce0f2`.
> 20 rules pinned, 8 tried and rejected with reasons, 1 deferred. See
> **Outcome** at the foot for what actually happened versus what was planned.

## Context

`oxlint.config.ts` is a deliberate ratchet: `correctness`, `suspicious` and `perf`
run as error categories, and 255 individual rules from `style`, `pedantic`,
`restriction` and `nursery` are pinned to error because the tree already
satisfies them. The file documents its own re-derivation recipe — promote a
category with `-W`, tally per rule, move the clean ones up.

That recipe is now nearly exhausted, and worse, it is misleading. Re-run against
oxlint 1.79.0 it reports 194 zero-finding unpinned rules — but **181 of those are
already enforced** by an enabled category. It cannot tell "clean and off" apart
from "clean and already on", so it overstates the remaining headroom by 14×.
Only 13 rules are genuinely clean and off.

The real headroom is in three places the recipe never looked:

1. **Rules pinned `off` that the tree has since caught up with.**
2. **Rules whose option knobs make them land clean** — measured at default
   settings and rejected, never retried with configuration.
3. **Rules whose findings all sit in one directory** that deserves an override.

This pass adds **31 rules**: 16 config-only and already at zero findings (the
largest being `no-undef` across the ~500 `.ts` files), and 15 behind ~55 small
fixes. It also replaces the recipe so the next pass starts from a true picture.

## Measurement

Measured against `main` at `71bf4f6`, oxlint 1.79.0, 1030 files. Baseline
`pnpm lint` is clean and takes ~10s.

```sh
# 1. per-rule finding counts, every off-category promoted
vp lint -W style -W pedantic -W restriction -W nursery -f json > all.json

# 2. exact category membership — this is the part the old recipe was missing.
#    --print-config resolves the config without linting; rules that come back
#    at "warn" are exactly that category's.
for c in correctness suspicious perf pedantic style restriction nursery; do
  vp lint -A all -A nursery -W $c --print-config > cat-$c.json
done

# 3. the rule inventory itself: 870 rules, 595 in the 7 enabled plugins
#    node_modules/.../oxlint/configuration_schema.json
#      -> definitions.DummyRuleMap.properties
```

Result: 51 632 findings over 146 rules. Subtracting the 255 already-configured
rules and the 181 already covered by an enabled category leaves the 13 below.

## 1. Flip two `off` entries back on

Both were disabled historically; the tree has since caught up.

| rule | measured now | action |
|---|---|---|
| `@typescript-eslint/unbound-method` | **0** | `"error"` |
| `import/no-unassigned-import` | 2, both CSS | `["error", { allow: ["**/*.css"] }]` |

The two sites are `src/routes/+layout.svelte:8` (`import "./layout.css"`) and
`src/lib/components/form/script/ScriptCanvas.svelte:22`
(`import "@xyflow/svelte/dist/style.css"`) — exactly what the rule's `allow`
glob is for.

The other five `off` entries stay off. Their counts belong in a comment so the
next pass does not re-measure them: `vitest/require-mock-type-parameters` 297,
`@typescript-eslint/no-unsafe-type-assertion` 228, `vitest/no-conditional-expect`
87, `oxc/no-map-spread` 27, `@typescript-eslint/consistent-return` 9.

## 2. Four new zero-finding rules

```ts
"unicorn/prefer-event-target": "error",   // pedantic
"prefer-spread": "error",                 // style, eslint core — see caveat
"import/unambiguous": "error",            // restriction
"promise/catch-or-return": "error",       // restriction
```

All four confirmed at 0 by an isolated run, not merely by absence from the bulk
tally.

**Caveat on `prefer-spread`.** Two distinct rules share the name: eslint-core
`prefer-spread` (0 findings) and `unicorn/prefer-spread` (5, see 8b). On the CLI
a bare `-W prefer-spread` resolves to **both**. The config keys are distinct in
the schema so an unprefixed entry should mean only the core rule — verify with
`vp lint --print-config` after adding it, and if it turns on both, land it after
8b has cleared the unicorn sites.

## 3. Two rules made clean by an option

```ts
// Default "always" reports 7 sites — every one the deliberate `x != null`
// nullish idiom (the same 7 `no-eq-null` flags). "smart" permits nullish,
// typeof and literal-to-literal comparisons and bans the rest.
eqeqeq: ["error", "smart"],

// The worst function in the tree takes 5 params (server/db/cache.db.ts:118);
// the default of 3 reports 11. Pinning at 5 is a non-regression ceiling.
"max-params": ["error", 5],
```

Do **not** also enable `no-eq-null` — it bans precisely what `eqeqeq: "smart"`
permits.

## 4. `no-undef` — the largest single win

`no-undef` (nursery) reports 1198 findings, but **1193 are Svelte runes**
(`$props` 401, `$derived` 348, `$bindable` 234, `$state` 187, `$effect` 23), and
89 of those are in `.svelte.ts` modules rather than markup. Declaring the runes
as globals leaves exactly **5**, and all 5 are oxlint's Svelte blind spot rather
than real defects:

- `sidebar-menu-button.svelte:96`, `item-root.svelte:57`, `empty.svelte:7` —
  reference `sidebarMenuButtonVariants` / `itemVariants` / `EmptyRoot`, each
  declared in the **`<script module>`** block of the same file, which oxlint
  does not hand to the rule; it lints only the instance `<script>`.
- `+error.svelte:18-19` — `$user`, a store auto-subscription of the `user`
  import. Oxlint does not model `$store` sugar.

```ts
globals: {
  $state: "readonly", $props: "readonly", $derived: "readonly",
  $bindable: "readonly", $effect: "readonly",
},
rules: { "no-undef": "error" },
```

plus `no-undef: "off"` folded into the **existing** `**/*.svelte` override, which
already carries this exact rationale for `no-useless-assignment`. Net: `no-undef`
enforced across the ~500 `.ts` files at zero cost.

## 5. Four rules on globally, off where the violations legitimately live

Each is 0 findings after its override, and none needs a source edit.

```ts
// 58 findings: 51 in scripts/ (47 console.log, 9 console.error), 7 in src/lib
// client code that cannot reach the server-only pino `Log` and uses
// warn/error/info. Allowing those three still bans stray console.log in src.
"no-console": ["error", { allow: ["warn", "error", "info"] }],

"unicorn/no-process-exit": "error",          // 6, all scripts/ — a CLI exiting is correct
"import/no-default-export": "error",         // 5, all root config files
"unicorn/no-array-method-this-argument": "error",  // 8, all in array.test.ts
```

Overrides: `scripts/**` turns off `no-console` and `unicorn/no-process-exit`;
the root config files turn off `import/no-default-export`;
`src/lib/utils/array/array.test.ts` — which deliberately exercises the `thisArg`
it is testing — turns off `unicorn/no-array-method-this-argument`.

## 6. Stale-suppression ratchet

`vp lint --report-unused-disable-directives` finds **1** stale directive among the
40 in the tree: `src/lib/server/sdk/payment/paystack/paystack.payment.sdk.ts:211`.
Remove it, then make the flag permanent so suppressions cannot rot.

The flag is **not** among the config schema's top-level keys, so it is CLI-only:
it goes on the `lint` and `lint:fix` scripts in `package.json`. Note the
consequence — the pre-commit gate is `vp check --fix`, which does not read those
scripts, so this ratchet only bites when `pnpm lint` is run directly.

## 7. Fix the maintenance docs

The recipe in the `oxlint.config.ts` header and in `AGENTS.md` is now actively
misleading. Replace it with the `--print-config` method above, and record the
three axes this pass used: re-measure `off` entries, try option knobs before
rejecting a rule, and check whether findings cluster in one directory.

`AGENTS.md` also still says all tooling config lives in `vite.config.ts` and
cites "~245 individual rules". Both need updating — the first is a false
statement an agent will act on.

## 8. Fix-then-enable: 15 rules, ~55 sites

Same discipline as the config's existing second pass: fix the findings in the
same commit that pins the rule, or suppress at the site with a reason.

### 8a. Type-aware correctness (23 sites)

**`typescript/no-deprecated`** — 8 sites, all genuine upstream deprecations:
`ai.service.ts:953,955,988,990` (`response` → `finalStep.response`, `ai` v7);
`query.schema.ts:35,42` (`ZodTypeAny` → `z.ZodType`, no generics — most likely to
need a signature change, `pnpm check` is the gate); `hooks.client.ts:17` (Sentry
`sendDefaultPii`); `call.util.ts:248` (deprecated `quality`).

**`typescript/no-unsafe-call`** — 8 sites, completing the `no-unsafe-*` family
(`no-unsafe-argument` is already pinned): `ai.service.test.ts:182,183,220,238`,
`campaign.service.test.ts:229`, `contact_import.service.test.ts:456` — type the
mocks; `scripts/webhook/endpoint.script.ts:214,216` — narrow the `error`-typed
value before calling it.

**`typescript/only-throw-error`** — 7 sites, all tests throwing non-Errors:
`conference.service.test.ts:41,48,54,60,70,76`, `call_sync.service.test.ts:55`.

### 8b. Mechanical rewrites (21 sites)

| rule | n | sites |
|---|---|---|
| `unicorn/prefer-code-point` | 5 | `transcript_rules.util.ts:311`, `strings.util.ts:82`, `image.client.ts:19`, `header.util.test.ts:35`, `csv.util.test.ts:33` |
| `unicorn/prefer-spread` | 5 | `file-drop-zone.svelte:51,66`, `header.util.ts:46`, `csv.util.test.ts:32`, `image.client.ts:17` |
| `unicorn/prefer-string-raw` | 4 | `index.repo.ts:235,236,237`, `redirect_uri.schema.test.ts:27` |
| `unicorn/prefer-global-this` | 2 | `accept-invite/+page.svelte:30,46` |
| `unicorn/text-encoding-identifier-case` | 2 | `csv.util.ts:37,83` — `"utf-8"`→`"utf8"` |
| `typescript/no-unnecessary-qualifier` | 2 | `src/app.d.ts:65,103` |
| `oxc/branches-sharing-code` | 2 | `member.services.ts:34`, `captcha.service.ts:65` |
| `typescript/ban-types` | 1 | `select-label.svelte:10` |
| `operator-assignment` | 1 | `call_webhook.service.test.ts:220` |
| `prefer-arrow-callback` | 1 | `hooks.server.ts:242` |
| `vitest/prefer-each` | 1 | `campaign_claim.service.test.ts:148` |

### 8c. Needs care (11 sites)

**`import/first`** — 9 sites, all test files with imports after `vi.mock(...)`:
`api_auth.service.test.ts:28-31`, `api_handler.service.test.ts:53,54`,
`api_audit.service.test.ts:19,20`, `rate_limit.service.test.ts:36`. Hoisting the
imports above the `vi.mock` calls is safe — vitest hoists `vi.mock` regardless —
but this is the one group that can change test behaviour. Run those files
individually before and after.

**`unicorn/prefer-top-level-await`** — 2 sites, `call_sync.service.ts:34,35`.
Confirm these are module-init chains and not deliberate fire-and-forget; if
deliberate, suppress at the site with a reason instead of converting.

`promise/prefer-await-to-callbacks` (5: `api_audit.service.ts:70`,
`webhook.service.ts:44`, `index.client.ts:66,113`, `usage.service.ts:166`) is
**skipped** — they are third-party SDK callback signatures, making it a
suppression-only rule.

## Verification

1. `pnpm lint` clean after **every** commit. For sections 1–7 that is the whole
   test; each rule was measured at 0.
2. `pnpm lint --report-unused-disable-directives` reports nothing.
3. `pnpm check` — the real gate for 8a: the Zod and `ai` SDK changes are
   type-level and surface here, not in lint.
4. `pnpm test:run` — the gate for 8a and 8c.
5. Spot-check the ratchet bites: add `console.log("x")` to a `src/lib` file and a
   bare `foo()` to a `.ts` file, confirm `no-console` / `no-undef` fire, revert.

## Rejected, with counts

Recorded so the next pass does not re-measure them.

- **Broad-distribution threshold rules** — `max-lines` 146 (worst 1600),
  `max-lines-per-function` 495 (worst 783), `max-statements` 343 (worst 147),
  `unicorn/max-nested-calls` 468, `import/max-dependencies` 131 (worst 35).
  Pinning at the current worst is not a meaningful ceiling. `complexity` (13,
  worst 96) and `max-statements` each have a single outlier —
  `script_revise.util.ts:245`, which is complexity 96, 147 statements, 622 lines
  — so `complexity: ["error", 35]` plus a site suppression would work if wanted.
  Left out by choice.
- **`no-undef` on `.svelte`** — all 5 residual findings are oxlint Svelte blind
  spots, not defects.
- **Deliberate patterns** — `max-classes-per-file` 2, `func-names` 2,
  `typescript/parameter-properties` 7, `no-bitwise` 2 (XOR in a crypto test),
  `default-case` 2 (already covered by `switch-exhaustiveness-check`),
  `node/no-sync` 5 (liquidjs sync render), `no-warning-comments` 7,
  `node/no-process-env` 8.
- **Denylist-family rules report 0 only because they are unconfigured** —
  `id-denylist`, `id-match`, `no-restricted-globals`, `no-restricted-imports`,
  `no-restricted-properties`, `no-restricted-exports`,
  `typescript/no-restricted-types`, `vitest/no-restricted-matchers`,
  `vitest/no-restricted-vi-methods`. They are policy hooks, not free wins;
  enable one only with an actual ban to encode.


## Outcome

20 rules now at error that were not before:

| section | rules |
|---|---|
| 1 | `@typescript-eslint/unbound-method`, `import/no-unassigned-import` |
| 2 | `unicorn/prefer-event-target`, `prefer-spread`, `import/unambiguous`, `promise/catch-or-return` |
| 3 | `max-params` (pinned at 5) |
| 4 | `no-undef` |
| 5 | `no-console`, `unicorn/no-process-exit`, `import/no-default-export`, `unicorn/no-array-method-this-argument` |
| 8b | `oxc/branches-sharing-code`, `typescript/ban-types`, `unicorn/prefer-code-point`, `prefer-arrow-callback`, `unicorn/prefer-global-this`, `unicorn/prefer-string-raw` |
| 8a | `typescript/no-deprecated`, `typescript/only-throw-error` |

Six real deprecations were migrated on the way: four uses of the `ai` SDK's
`res.response` and two of Zod's `ZodTypeAny`.

### Rejected during execution, and why

The plan assumed the option knobs and autofixes would behave. Several did not,
which is the main thing worth carrying forward:

- **`eqeqeq`** — planned as `["error", "always", { null: "ignore" }]`. Cannot be
  expressed: oxlint's `eqeqeq` takes a three-element tuple
  `[severity, CompareType, EqeqeqOptions]`, and the vite-plus bridge rewrites any
  array rule value as `[...options, severity, ...options]`. Two-element rules
  tolerate that; three-element ones fail to parse. Affects `curly`, `func-style`,
  `object-shorthand`, `yoda` and 14 others equally. Retry after a vite-plus bump.
- **`unicorn/prefer-spread`** — contradicts the already-enabled
  `typescript/no-misused-spread`. Its autofix turns `str.split("")` into
  `[...str]`, which the other rule then rejects for breaking surrogate pairs.
- **`operator-assignment`** — its one site's autofix silently dropped the
  `as number` assertion, leaving `unknown += 1`.
- **`unicorn/text-encoding-identifier-case`** — rewrote a domain value, leaving
  `encoding: "utf8"` beside `"utf-16le"`, and missed the real
  `TextDecoder("utf-8")` call.
- **`typescript/no-unnecessary-qualifier`** — dropping `App.` in `app.d.ts`
  leaves an unqualified `Error` that shadows the built-in, since `App` declares
  its own `Error`.
- **`vitest/prefer-each`** — its one site is already table-driven over a `PATHS`
  const; `describe.each` would only rename every test.
- **`unicorn/prefer-top-level-await`** — misreads Zod's `.catch(null)` as a
  promise chain. Both findings are `z.coerce.date().nullish().catch(null)`.
- **`import/first`** — fights a deliberate, commented convention: the API tests
  keep each `vi.mock` beside the docblock explaining it and import the mocked
  modules below, which vitest hoists anyway.

### Deferred

`typescript/no-unsafe-call` — 7 of 9 findings are the same mock-typing work, but
2 sit in `contact_import.service.test.ts`, which was mid-refactor. Fix those and
pin it.

### Note for the next pass

Write suppressions with the prose **first** and `// oxlint-disable-next-line
<rule>` as the **last** comment line before the reported line. A `--` description
does not continue onto a following comment line, so a multi-line reason placed
after the directive silently targets the wrong line — it reads as an unused
directive *and* leaves the finding unsuppressed. `pnpm lint` now passes
`--report-unused-disable-directives`, which catches exactly that mistake.
