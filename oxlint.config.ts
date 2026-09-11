import type { OxlintConfig } from "vite-plus/lint";

/**
 * Oxlint's configuration, deliberately in its own `.ts` file rather than inline in
 * `vite.config.ts`, and deliberately NOT `.oxlintrc.json`.
 *
 * **Why not inline.** The oxc editor extension (VS Code, Zed) can only read an
 * *oxlint* config file — it cannot read `vite.config.ts`. While these rules lived in
 * the `lint` block there, the editor silently linted with stock oxlint defaults, so
 * every squiggle disagreed with what `pnpm lint` reported. `.vscode/settings.json`
 * sets `oxc.requireConfig: true` so that a missing or unreadable config fails loudly
 * instead of falling back to those defaults again.
 *
 * **Why not `.oxlintrc.json`.** `vp config` runs on every install (via the `prepare`
 * script). It scans for `.oxlintrc.json`/`.oxlintrc.jsonc`, merges them back into
 * `vite.config.ts`, and *deletes the file*. vite-plus does not scan for
 * `oxlint.config.ts`, so this form survives. Oxlint loads TS configs when invoked
 * through Node, which is how both the CLI wrapper and the editor extension invoke it.
 *
 * **Do not convert this to JSON.**
 *
 * Two traps when editing rules here:
 *
 * 1. Per-rule option shapes live in `node_modules/oxlint/configuration_schema.json`
 *    under `definitions.DummyRuleMap.properties`. Read the whole tuple, not just the
 *    second slot.
 * 2. The vite-plus config bridge rewrites an array rule value as
 *    `[...options, severity, ...options]`. Two-element rules tolerate that; rules
 *    taking a three-element tuple (`eqeqeq`, `curly`, `func-style`,
 *    `object-shorthand`, `yoda`) cannot be given options at all until that is fixed
 *    upstream — they fail with "Failed to parse oxlint configuration file."
 */
export default {
  plugins: [
    "oxc",
    "typescript",
    "unicorn",
    "vitest",
    "promise",
    "import",
    "node",
  ],

  options: { typeAware: true, typeCheck: true },

  env: {
    builtin: true,
    browser: true,
    node: true,
  },

  /**
   * Svelte's runes are compiler intrinsics with no import, so `no-undef` sees a call
   * to an undeclared name. Declaring them here is what makes that rule usable at all
   * — otherwise essentially every finding it reports is a rune.
   */
  globals: {
    $state: "readonly",
    $props: "readonly",
    $derived: "readonly",
    $bindable: "readonly",
    $effect: "readonly",
  },

  /**
   * Nothing sits at "warn" on purpose. The only automated lint gate is
   * `vp check --fix` in the pre-commit hook, and it reads errors only — so a warning
   * is a finding that nobody is ever required to clear.
   *
   * `style`, `pedantic`, `restriction` and `nursery` stay off as whole categories;
   * they are worth ratcheting rule by rule rather than switching on wholesale. See
   * `.planning/oxlint-ratchet-spec.md` for the measurement recipe.
   */
  categories: {
    correctness: "error",
    suspicious: "error",
    perf: "error",
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
    ".claude",
    "drizzle/",
    "infra/.terraform/",
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

  overrides: [
    {
      /**
       * Oxlint only ever sees the extracted `<script>`, never the template. A
       * `$props()` binding that is read only in markup therefore looks like a dead
       * store, and the `no-undef` findings that remain are `<script module>`
       * declarations and `$store` auto-subscription sugar.
       */
      files: ["**/*.svelte"],
      rules: { "no-useless-assignment": "off", "no-undef": "off" },
    },
    {
      /**
       * `export {}` is what makes an ambient declaration file a module, which is
       * what lets `declare global` mean anything. The rule's "remove the empty
       * braces" fix would silently turn this back into a script.
       */
      files: ["src/app.d.ts"],
      rules: { "unicorn/require-module-specifiers": "off" },
    },
    {
      // CLI entry points: printing and exiting is the job.
      files: ["scripts/**"],
      rules: { "no-console": "off", "unicorn/no-process-exit": "off" },
    },
    {
      // Consumed by tooling that requires a default export.
      files: ["*.config.ts", "*.config.js", "svelte.config.js"],
      rules: { "import/no-default-export": "off" },
    },
  ],
} satisfies OxlintConfig;
