import { sentrySvelteKit } from "@sentry/sveltekit";
import node from "@sveltejs/adapter-node";
import vercel from "@sveltejs/adapter-vercel";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { SondaVitePlugin as sonda } from "sonda";
import devtoolsJson from "vite-plugin-devtools-json";
import { defineConfig } from "vite-plus";

import lint from "./oxlint.config";

const SONDA = process.env.SONDA;

/** The `sql` project's `include` and the `server` project's `exclude`, so they cannot drift. */
const SQL_TESTS = ["**/db/repos/**/*.test.ts"];

// Vercel sets VERCEL=1 on every build it runs. Anywhere else — Docker, a VPS,
// `pnpm preview` — build a standalone Node server instead.
//
// Deliberately not `adapter-auto`: it accepts no options, and it has no
// fallback to adapter-node for a plain container, so off-platform it warns and
// emits nothing — which is exactly the case this switch exists to make work.
const adapter = process.env.VERCEL ? vercel() : node();

export default defineConfig({
  /**
   * `vp fmt` does NOT read `.oxfmtrc.json`. With no config it silently formats a
   * subset — skipping every `.svelte` file — rather than failing, so a sanity check
   * after changing anything here is that `pnpm format:check` still reports roughly
   * as many files as the repo has.
   *
   * Ignores must live here and not in a `.prettierignore`, so that the pre-commit
   * hook and the editor LSP honour the same list.
   */
  fmt: {
    bracketSameLine: false,
    singleAttributePerLine: true,
    printWidth: 80,
    sortPackageJson: false,
    svelte: {},
    sortTailwindcss: { stylesheet: "./src/routes/layout.css" },
    ignorePatterns: [
      "pnpm-lock.yaml",
      "drizzle/**",
      "static/**",
      ".claude/**",
      ".agents/**",
      ".github/**",
      ".vite-hooks/**",
      "node_modules",
      "infra/.terraform/**",
      "infra/terraform.tfstate*",
    ],
  },

  lint,

  // Widened from "*.{ts,svelte}" now that oxfmt handles md/json/css/yaml too.
  staged: {
    "*": "vp check --fix",
  },

  build: {
    sourcemap: SONDA ? true : undefined,
  },

  plugins: [
    sentrySvelteKit({
      telemetry: false,
      bundleSizeOptimizations: {
        excludeDebugStatements: true,
        excludeReplayShadowDom: true,
        excludeReplayIframe: true,
        excludeReplayWorker: true,
      },
    }),
    tailwindcss({ optimize: { minify: true } }),
    sveltekit({
      adapter,

      paths: {
        // adapter-node no longer reads ORIGIN at run time, so the origin used
        // for CSRF checks is fixed at build time instead. The image is already
        // per-origin (PUBLIC_BASE_URL is compiled into the client), so this is
        // the same value. It is read from the real environment, not `.env`, so
        // a local `pnpm build` still derives it from the request. Left unset on
        // Vercel, whose preview deployments each have their own URL.
        origin: process.env.VERCEL
          ? undefined
          : process.env.PUBLIC_BASE_URL || undefined,
      },

      experimental: {
        remoteFunctions: true,
      },

      tracing: {
        server: true,
      },

      dynamicCompileOptions: ({ filename }) =>
        filename.includes("node_modules") ? undefined : { runes: true },

      compilerOptions: {
        experimental: {
          async: true,
        },
      },
    }),
    devtoolsJson(),
    sonda({
      enabled: Boolean(SONDA),
      server: true,
      open: false,
      deep: true,
      sources: true,
    }),
  ],

  test: {
    // Not the repo root, which would also collect the copies in `.claude/worktrees/*`.
    dir: "src",

    expect: { requireAssertions: true },
    /**
     * So a `vi.stubGlobal` cannot bleed into the next test — which it did, since a
     * failing assertion returns before any per-file un-stub hook gets to run.
     */
    unstubGlobals: true,
    coverage: {
      include: ["src/lib/server/services/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.d.ts"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          // Safe only because of the mock wall — see AGENTS.md § Testing.
          isolate: false,
          exclude: SQL_TESTS,
          setupFiles: ["src/test/setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          // Repo tests need a real drizzle and `index.repo` — see AGENTS.md § Testing.
          name: "sql",
          environment: "node",
          isolate: false,
          // Relative to the inherited `dir: "src"`.
          include: SQL_TESTS,
          setupFiles: ["src/test/setup.sql.ts"],
        },
      },
    ],
  },
});
