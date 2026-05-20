import { sentrySvelteKit } from "@sentry/sveltekit";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { SondaVitePlugin as sonda } from "sonda";
import devtoolsJson from "vite-plugin-devtools-json";
import { defineConfig } from "vite-plus";

const SONDA = process.env.SONDA;

export default defineConfig({
  staged: {
    "*.{ts,svelte}": "vp check --fix",
  },

  lint: {
    plugins: ["oxc", "typescript", "unicorn", "vitest", "promise", "import", "node"],
    jsPlugins: ["eslint-plugin-svelte"],
    options: { typeAware: true, typeCheck: true },
    env: {
      builtin: true,
      browser: true,
      node: true,
    },
    categories: {
      correctness: "error",
      suspicious: "warn",
      perf: "warn",
      // style: "warn",
      // nursery: "warn",
    },
    ignorePatterns: [
      "**/.DS_Store",
      "**/node_modules",
      "build",
      ".svelte-kit",
      "package",
      "**/.env",
      "**/.env.*",
      "!**/.env.example",
      "**/.vercel",
      "**/.env*.local",
      "**/tmp",
      "**/.env.sentry-build-plugin",
      "**/.sonda",
      ".planning",
      "infra/.terraform/",
      "infra/.terraform.lock.hcl",
      "infra/terraform.tfstate",
      "infra/terraform.tfstate.backup",
      "infra/terraform.tfvars",
    ],
    rules: {
      "oxc/no-map-spread": "off",
      "import/no-unassigned-import": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/consistent-return": "off",
      "@typescript-eslint/no-unsafe-type-assertion": "off",
      "vitest/require-mock-type-parameters": "off",
      "vitest/no-conditional-expect": "off",

      "no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
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
