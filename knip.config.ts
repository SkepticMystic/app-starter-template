import type { KnipConfig } from "knip";

export default {
  // Most of this is what knip's SvelteKit plugin would add, had it found kit:
  // it looks for `svelte.config.js` (gone in kit 3) or a static `sveltekit`
  // import in `vite.config.ts` (dynamic here, inside `lazyPlugins`). Kit 3's
  // `src/params.ts`, not its `src/params/*`.
  entry: [
    // Scripts run via pnpm
    "scripts/**/*.ts",
    "src/routes/**/+{page,server,page.server,error,layout,layout.server}{,@*}.{js,ts,svelte}",
    "src/hooks.{server,client}.ts",
    "src/instrumentation.server.ts",
    "src/params.{js,ts}",
    "src/env.{js,ts}",
    // Kit compiles every `*.remote.ts` into an endpoint whether or not a page
    // imports it, so each one is reachable from the network on its own.
    "src/**/*.remote.{js,ts}",
    // Opt-in kits no page uses yet, kept so a fork can wire them in: image
    // upload and display, Paystack subscriptions and transactions, markdown.
    // Entries rather than ignores, so their own imports still count.
    "src/lib/clients/**/*.client.ts",
    "src/lib/components/form/image/UploadImagesForm.svelte",
    "src/lib/components/image/Picture.svelte",
    "src/lib/utils/markdown/markdown.util.ts",
  ],

  // Kit's virtual modules, which that plugin would also have ignored.
  ignoreUnresolved: [/^\$app\//],

  // Things knip cannot see:
  // - @iconify-json/lucide: consumed via @iconify/tailwind4 in CSS
  // - @typescript/native: run by path in `check:scripts`
  // - @vitest/ui: backs `pnpm test:ui`; vitest is bundled inside vite-plus
  // - pino-pretty: loaded from a transport string in logger.util.ts
  ignoreDependencies: [
    "@iconify-json/lucide",
    "@typescript/native",
    "@vitest/ui",
    "pino-pretty",
  ],

  // UI component library — sub-components are re-exported or used ad hoc,
  // and its barrels re-export everything by design. No `.claude/**` or
  // `.agents/**`: knip skips dot-directories and honours `.gitignore` already.
  ignoreFiles: ["src/lib/components/ui/**/*.svelte"],
  ignoreIssues: {
    "src/lib/components/ui/**": ["exports", "types"],
  },

  tailwind: {
    entry: ["tailwind.config.{js,cjs,mjs,ts}", "src/routes/layout.css"],
  },

  vite: {
    config: ["vite.config.{js,mjs,ts,cjs,mts,cts}"],
  },

  // Bundled in vite-plus, so knip can't auto-detect it
  oxlint: {
    config: [".oxlintrc.json", "oxlint.config.ts"],
  },

  // vitest is bundled inside vite-plus, so knip can't auto-detect it
  vitest: {
    config: ["vite.config.{js,ts}"],
    entry: ["src/**/*.test.ts", "src/test/setup.ts", "src/test/setup.sql.ts"],
  },
} satisfies KnipConfig;
