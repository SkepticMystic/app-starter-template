import { sentrySvelteKit } from "@sentry/sveltekit";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { SondaVitePlugin as sonda } from "sonda";
import devtoolsJson from "vite-plugin-devtools-json";
import { defineConfig } from "vite-plus";

import lint from "./oxlint.config";

const SONDA = process.env.SONDA;

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
      ".github/**",
      ".vite-hooks/**",
      ".planning/**",
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
    sveltekit(),
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
          include: ["src/**/*.{test,spec}.{js,ts}"],
          exclude: [
            "src/**/*.svelte.{test,spec}.{js,ts}",
            "src/**/*.itest.{js,ts}",
          ],
          setupFiles: ["src/test/setup.ts"],
        },
      },
    ],
  },
});
