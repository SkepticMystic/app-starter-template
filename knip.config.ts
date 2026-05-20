import type { KnipConfig } from "knip";

export default {
  // Scripts run via pnpm
  entry: ["scripts/**/*.ts"],

  // Icon sets consumed via @iconify/tailwind4 in CSS
  ignoreDependencies: ["@iconify-json/lucide"],

  // UI component library — sub-components are re-exported or used ad-hoc
  ignoreFiles: ["src/lib/components/ui/**/*.svelte"],

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
    entry: ["src/**/*.test.ts", "src/test/setup.ts"],
  },
} satisfies KnipConfig;
