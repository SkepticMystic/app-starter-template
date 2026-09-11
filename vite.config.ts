import { sentrySvelteKit } from "@sentry/sveltekit";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { SondaVitePlugin as sonda } from "sonda";
import devtoolsJson from "vite-plugin-devtools-json";
import { defineConfig } from "vite-plus";

import lint from "./oxlint.config";

const SONDA = process.env.SONDA;

export default defineConfig({
  staged: {
    "*.{ts,svelte}": "vp check --fix",
  },

  lint,

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
    coverage: {
      include: ["src/lib/server/services/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.d.ts"],
    },
    projects: [
      {
        extends: "./vite.config.js",
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
          exclude: ["src/**/*.svelte.{test,spec}.{js,ts}", "src/**/*.itest.{js,ts}"],
          setupFiles: ["src/test/setup.ts"],
        },
      },
    ],
  },
});
