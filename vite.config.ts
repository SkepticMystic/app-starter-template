import { defineConfig, lazyPlugins } from "vite-plus";

import lint from "./oxlint.config";

const SONDA = process.env.SONDA;

/**
 * Tests that compile real SQL — the `Repo` wrapper's and each `*.query.ts`'s.
 * The `sql` project's `include` and the `server` project's `exclude`, so they
 * cannot drift.
 */
const SQL_TESTS = ["**/db/repos/**/*.test.ts", "**/*.query.test.ts"];

/**
 * The Umami origin, when the build sets one — read from the real environment
 * like `paths.origin` below, since it is static and baked into the bundle.
 */
const umami_origin = (): `https://${string}.${string}`[] => {
  try {
    return process.env.PUBLIC_UMAMI_BASE_URL
      ? [
          new URL(process.env.PUBLIC_UMAMI_BASE_URL)
            .origin as `https://${string}.${string}`,
        ]
      : [];
  } catch {
    return [];
  }
};

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
    /**
     * Never `undefined`: Sentry's source-map-setting plugin silently turns that
     * into `"hidden"`, and this line is the only way to stop it.
     *
     * - `SENTRY_AUTH_TOKEN` set: `"hidden"`, uploaded then deleted, and no
     *   `sourceMappingURL` comment pointing at a missing file.
     * - `SONDA` set: `true`, for the bundle analyser.
     * - Otherwise `false`: nothing would upload or read them.
     */
    sourcemap: SONDA ? true : process.env.SENTRY_AUTH_TOKEN ? "hidden" : false,
  },

  /**
   * `vp fmt`, `vp lint`, `vp check` and the editor LSPs load this file only for
   * `fmt` and `lint`; `lazyPlugins` skips this factory for them. Keep the
   * imports inside it — a top-level import makes every one of those commands
   * pay for the plugins.
   */
  plugins: lazyPlugins(async () => {
    const [
      { sentrySvelteKit },
      { sveltekit },
      { default: node },
      { default: vercel },
      { default: tailwindcss },
      { SondaVitePlugin: sonda },
    ] = await Promise.all([
      import("@sentry/sveltekit/vite"),
      import("@sveltejs/kit/vite"),
      import("@sveltejs/adapter-node"),
      import("@sveltejs/adapter-vercel"),
      import("@tailwindcss/vite"),
      import("sonda"),
    ]);

    // Vercel sets VERCEL=1 on every build it runs. Anywhere else — Docker, a
    // VPS, `pnpm preview` — build a standalone Node server instead.
    //
    // Deliberately not `adapter-auto`: it accepts no options, and it has no
    // fallback to adapter-node for a plain container, so off-platform it warns
    // and emits nothing — which is exactly the case this switch exists to make
    // work.
    const adapter = process.env.VERCEL ? vercel() : node();

    return [
      sentrySvelteKit({
        telemetry: false,
        sourcemaps: {
          // `build/` is adapter-node's re-bundle, which `build.sourcemap` cannot
          // reach: it hardcodes `sourcemap: true` for the server.
          filesToDeleteAfterUpload: [
            "./.svelte-kit/output/**/*.map",
            "./build/**/*.map",
          ],
        },
        // Do not add `autoUploadSourceMaps: false`. It does not stop the source
        // maps (`build.sourcemap` does), it silently turns build telemetry back
        // on, and it drops the plugin that injects `__sentry_sveltekit_output_dir`,
        // so server frames lose their `chunks/` path.
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

        /**
         * Report-only: violations go to Sentry (Security → CSP) through the
         * `csp-endpoint` group that `hooks.server.ts` names per response, and
         * Firefox's `report-uri` it appends there. Learn the list from those
         * reports, then promote it to `directives` as its own change.
         *
         * `mode: "auto"` nonces kit's own scripts on a rendered page and hashes
         * them on a prerendered one. mode-watcher's theme bootstrap is emitted
         * from `app.html` under the same nonce (`%modewatcher.snippet%`), since
         * one injected through `<svelte:head>` cannot carry it.
         *
         * - Turnstile: `challenges.cloudflare.com` (script, frame, connect).
         * - Sentry: any ingest host under `sentry.io`.
         * - Umami: its origin, when the build sets one.
         * - Cloudinary, Dicebear and R2 presigned URLs are images or links,
         *   which `img-src https:` and navigation already allow.
         * - `style-src 'unsafe-inline'`: Svelte `style=` attributes and
         *   sonner's runtime stylesheet. Kit adds no nonce to styles while it
         *   is present, which would switch it off.
         */
        csp: {
          mode: "auto",
          reportOnly: {
            "default-src": ["self"],
            "script-src": [
              "self",
              "https://challenges.cloudflare.com",
              ...umami_origin(),
            ],
            "style-src": ["self", "unsafe-inline"],
            "img-src": ["self", "data:", "blob:", "https:"],
            "font-src": ["self", "data:"],
            "connect-src": [
              "self",
              "https://*.sentry.io",
              "https://challenges.cloudflare.com",
              ...umami_origin(),
            ],
            "frame-src": ["https://challenges.cloudflare.com"],
            "worker-src": ["self", "blob:"],
            "frame-ancestors": ["self"],
            "form-action": ["self"],
            "base-uri": ["self"],
            "object-src": ["none"],
            "report-to": ["csp-endpoint"],
          },
        },

        experimental: {
          remoteFunctions: true,
        },

        tracing: {
          server: true,
        },

        // Nothing to enable in vite-plugin-svelte's `experimental`:
        // `sendWarningsToBrowser` and `disableSvelteResolveWarnings` are dev-log
        // toggles, and `compileModule` is a filename filter, not a switch — its
        // plugin always runs, and the default `*.svelte.{ts,js}` covers every
        // rune module here.
        dynamicCompileOptions: ({ filename }) =>
          filename.includes("node_modules") ? undefined : { runes: true },

        compilerOptions: {
          experimental: {
            async: true,
          },
        },
      }),
      sonda({
        enabled: Boolean(SONDA),
        server: true,
        open: false,
        deep: true,
        sources: true,
      }),
    ];
  }),

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
