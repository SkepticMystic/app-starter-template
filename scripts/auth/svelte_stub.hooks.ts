/**
 * Preloaded into the Better-Auth CLI by `check.script.ts` (`--import`). The CLI
 * loads `auth.ts` with jiti, which hands a `.svelte` import to Node, and Node
 * refuses the extension. `auth.ts` reaches the email templates through
 * `Mailer`, so every `.svelte` module becomes an empty component: a schema
 * diff never renders one.
 *
 * Run by bare `node`, so erasable syntax only (`tsconfig.scripts.json`).
 */
import { registerHooks } from "node:module";

registerHooks({
  load(url, context, nextLoad) {
    if (new URL(url).pathname.endsWith(".svelte")) {
      return {
        format: "module",
        source: "export default function SvelteStub() {}",
        shortCircuit: true,
      };
    }

    return nextLoad(url, context);
  },
});
