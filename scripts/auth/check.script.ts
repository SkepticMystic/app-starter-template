/**
 * Better-Auth's own schema check — can `schema.ts` hold what `src/lib/auth.ts`
 * writes? — run against the real config with no secrets, so CI can gate on it.
 *
 *   pnpm auth:check
 *
 * The CLI (`auth check schema`) diffs the drizzle schema object, never the
 * database, but it has to _load_ `auth.ts`, and that evaluates its import
 * graph: `new URL(PUBLIC_BASE_URL)`, the Resend and Upstash clients and the
 * database pool are all built at module scope. Its `$app/env/*` stub is a bare
 * `process.env`, so `src/env.ts` never runs — no defaults, no placeholders —
 * and a missing value surfaces only as "Could not load the Better Auth
 * configuration." (exit 2), the cause swallowed.
 *
 * So it gets the test suite's environment: `env.mock.ts` derives one from
 * `src/env.ts`, so a newly declared variable is covered the moment it exists.
 * It wins over anything already set, since a static diff needs no real value.
 *
 * The same graph reaches the email templates, which are `.svelte` and which
 * jiti cannot load, so the CLI gets `svelte_stub.hooks.ts` preloaded.
 *
 * Run under `vite-node`, not bare node, so `src/env.ts` resolves its imports.
 */
import { spawnSync } from "node:child_process";
import { mock_env, mock_public_env } from "../../src/test/env.mock.ts";

const svelte_stub = new URL("svelte_stub.hooks.ts", import.meta.url).href;

const placeholders = Object.fromEntries(
  Object.entries({ ...mock_env, ...mock_public_env }).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  ),
);

const run = spawnSync("auth", ["check", "schema"], {
  stdio: "inherit",
  env: {
    ...process.env,
    ...placeholders,
    NODE_OPTIONS: [process.env.NODE_OPTIONS, `--import=${svelte_stub}`]
      .filter(Boolean)
      .join(" "),
  },
});

if (run.error) {
  console.error(run.error);
  process.exit(2);
}

// 0 clean, 1 a mismatch, 2 could not check.
process.exit(run.status ?? 2);
