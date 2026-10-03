/**
 * Structural invariants on `src/env.ts`, the app's one list of environment
 * variables — what CI can prove without credentials.
 *
 *   pnpm env:check
 *
 * `src/test/env.test.ts` asserts the same things, plus `.env.example` parity;
 * this is the fast, test-runner-free form for CI and a pre-push check.
 *
 * Unlike call-center, `static: true` is allowed: `APP_ENV` and the `PUBLIC_*`
 * set are deliberately inlined at build time here (see AGENTS.md § Container).
 */
import { declared } from "../../src/env.ts";

const errors: string[] = [];

for (const [name, config] of declared) {
  // Kit renders it as the hover documentation at every import.
  if (!config.description?.trim()) {
    errors.push(`${name}: no description.`);
  }

  // Kit decides visibility by `public`, never the prefix. The prefix is all a
  // dashboard or an `.env` listing has to say a value is not confidential.
  const prefixed = name.startsWith("PUBLIC_");

  if (prefixed && !config.public) {
    errors.push(`${name}: named PUBLIC_* but not \`public: true\`.`);
  }

  if (!prefixed && config.public) {
    errors.push(`${name}: \`public: true\` but not named PUBLIC_*.`);
  }

  // Without a schema kit silently means "set, but may be empty".
  if (!config.schema) {
    errors.push(
      `${name}: no schema. Use \`required(...)\` or \`optional(...)\`.`,
    );
  }

  // A public value inlined at build time is compiled into the client bundle,
  // so it must never be a secret — and a static private one is in the image.
  if (config.static && !config.public && name !== "APP_ENV") {
    errors.push(
      `${name}: a static private variable is compiled into the server bundle. Only APP_ENV is, on purpose.`,
    );
  }
}

if (errors.length > 0) {
  console.error("src/env.ts is inconsistent:\n");
  for (const line of errors) console.error(`  - ${line}`);
  console.error("");
  process.exit(1);
}

console.log(`src/env.ts: ${declared.length} variables, all consistent.`);
