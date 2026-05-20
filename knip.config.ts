import type { KnipConfig } from "knip";

export default {
  entry: ["scripts/**/*.ts"],

  ignoreDependencies: ["@iconify-json/lucide"],

  ignoreFiles: ["src/lib/components/ui/**/*.svelte"],

  tailwind: {
    entry: ["tailwind.config.{js,cjs,mjs,ts}", "src/routes/layout.css"],
  },

  vite: {
    config: ["vite.config.{js,mjs,ts,cjs,mts,cts}"],
  },

  oxlint: {
    config: [".oxlintrc.json", "oxlint.config.ts"],
  },

  vitest: {
    config: ["vite.config.{js,ts}"],
    entry: ["src/**/*.test.ts", "src/test/setup.ts"],
  },
} satisfies KnipConfig;
