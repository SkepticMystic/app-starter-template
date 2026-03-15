import { sentrySvelteKit } from "@sentry/sveltekit";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

const SONDA = process.env.SONDA;

export default defineConfig({
  staged: {
    "*.{ts,svelte}": "vp check --fix",
  },

  lint: {
    plugins: ["oxc", "typescript", "unicorn", "vitest", "promise", "import", "node"],
    categories: {
      correctness: "error",
      // suspicious: "warn",
      perf: "warn",
      // style: "warn",
      // nursery: "warn",
    },
    env: {
      builtin: true,
      browser: true,
      node: true,
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
      "infra/.terraform/",
      "infra/.terraform.lock.hcl",
      "infra/terraform.tfstate",
      "infra/terraform.tfstate.backup",
      "infra/terraform.tfvars",
    ],
    rules: {
      "@typescript-eslint/unbound-method": "off",

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
    jsPlugins: ["eslint-plugin-svelte"],

    options: {
      typeAware: true,
      typeCheck: true,
    },
  },

  build: { sourcemap: Boolean(SONDA) },
  plugins: [sentrySvelteKit({ telemetry: false }), tailwindcss(), sveltekit()],

  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: "./vite.config.js",
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
          exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
        },
      },
    ],
  },
});

// if (SONDA) {
//   config.plugins?.push(
//     sonda({
//       server: true,
//       open: false,
//       deep: true,
//       sources: true,
//     }),
//   );
// }
