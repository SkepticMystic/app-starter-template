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
   * `.planning/reference/oxlint-ratchet-spec.md` for the measurement recipe.
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
    // Shell and proxy config; oxlint has nothing to say about either.
    "deploy",
    "**/.env*.local",
    "**/tmp",
    "**/.env.sentry-build-plugin",
    "**/.sonda",
    ".planning",
    ".claude",
    ".agents",
    "drizzle/",
    "infra/.terraform/",
    "infra/terraform.tfstate",
    "infra/terraform.tfstate.backup",
    "infra/terraform.tfvars",
  ],

  rules: {
    // Not worth the churn yet. Counts measured 2026-09-11 against oxlint 1.81.0
    // and recorded so the next pass need not re-derive them — but re-measure
    // before trusting them, since a rule the tree has caught up with can simply
    // be flipped.
    "@typescript-eslint/consistent-return": "off", // 5 findings
    "@typescript-eslint/no-unsafe-type-assertion": "off", // 15
    "vitest/require-mock-type-parameters": "off", // 40
    "vitest/no-conditional-expect": "off", // 32

    // One finding, in `UserAccountsList.svelte`, where the in-place form the
    // rule suggests would mutate the rows the remote query holds. Kept on with
    // an inline exception there rather than off across the tree.
    "oxc/no-map-spread": "error",

    // The only finding is `+layout.svelte` → `./layout.css`, a stylesheet
    // side-effect import, which is what `allow` is for.
    "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],

    // Oxlint sees only the instance `<script>` of a `.svelte` file, so runes read
    // as undefined identifiers and `<script module>` declarations are invisible
    // to it. Declaring the runes as globals (above) and turning this off for
    // `**/*.svelte` leaves it enforced across the ~500 `.ts` files, where it is
    // sound.
    "no-undef": "error",

    // Every finding is in `scripts/` (see override) or in client code that
    // cannot reach the server-only pino `Log`. Allowing the three levels that
    // code uses still bans a stray `console.log` anywhere in `src`.
    "no-console": ["error", { allow: ["warn", "error", "info"] }],

    // Every finding is in `scripts/` — a CLI exiting is correct. See override.
    "unicorn/no-process-exit": "error",

    // Every finding is a root config file. See override.
    "import/no-default-export": "error",

    // Every finding is in `array.test.ts`, which exercises the `thisArg` it is
    // testing. See override.
    "unicorn/no-array-method-this-argument": "error",

    // Zero findings, so the bare severity is enough. Note the options form is
    // unavailable regardless: oxlint's `eqeqeq` takes a three-element tuple
    // `[severity, CompareType, EqeqeqOptions]`, and the vite-plus config bridge
    // rewrites any array rule value as `[...options, severity, ...options]`,
    // which only ever deserialises for the two-element rules. So if the nullish
    // `x != null` idiom ever earns its place here, `{ null: "ignore" }` cannot
    // be expressed and the rule would have to come back off until vite-plus is
    // fixed. Verified against vite-plus 0.3.1 / oxlint 1.81.0.
    eqeqeq: "error",

    // Nothing in the tree takes more than three parameters, so this is the
    // rule's own default pinned as a non-regression ceiling rather than a
    // threshold chosen to accommodate a current worst case.
    "max-params": ["error", 3],

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

    // `let x; const f = () => x; x = …` is the one shape that cannot be a `const`, and
    // the tree uses it for mutually-referring unsubscribe handles.
    "prefer-const": ["error", { ignoreReadBeforeAssign: true }],

    // A `default` branch counts as covering the rest of a union. Without this the rule
    // demands an explicit `case undefined:` on every switch over an optional value,
    // which is noise — the useful half is catching a *new* union member that no
    // existing `case` and no `default` handles.
    "typescript/switch-exhaustiveness-check": [
      "error",
      { considerDefaultExhaustiveForUnions: true },
    ],

    /**
     * Everything below was verified to have **zero** findings across the tree before
     * being switched on (the handful with one to four findings were fixed in the same
     * commit). They cost nothing today and fail the pre-commit hook the moment new code
     * introduces one — that is the whole point of the list.
     *
     * To re-derive it after an oxlint upgrade, a plain tally is not enough — it
     * reports ~194 rules as clean and unpinned, but 181 of those are already
     * enforced by an enabled category and it cannot tell them apart. Take the
     * category membership too:
     *
     *   vp lint -W style -W pedantic -W restriction -W nursery -f json > all.json
     *   for c in pedantic style restriction nursery correctness suspicious perf; do
     *     vp lint -A all -A nursery -W $c --print-config > cat-$c.json
     *   done
     *
     * `--print-config` does no linting, so the second loop is instant; rules that
     * come back at "warn" belong to that category. A rule is a genuine candidate
     * only if it is clean AND in one of the four off-categories.
     *
     * See AGENTS.md for the three axes a tally misses (re-measure the `off`
     * entries, try a rule's options before rejecting it, check whether findings
     * all cluster in one directory) and for the two traps: read a rule's whole
     * option tuple in oxlint's configuration_schema.json, and note that the
     * vite-plus bridge cannot pass options to three-element-tuple rules at all.
     */

    // --- pedantic — strict, occasional false positives (62 rules) ---
    // eslint
    "accessor-pairs": "error",
    "array-callback-return": "error",
    "max-depth": "error",
    "max-nested-callbacks": "error",
    "no-array-constructor": "error",
    "no-case-declarations": "error",
    "no-constructor-return": "error",
    "no-fallthrough": "error",
    "no-loop-func": "error",
    "no-new-wrappers": "error",
    "no-object-constructor": "error",
    "no-prototype-builtins": "error",
    "no-self-compare": "error",
    "no-throw-literal": "error",
    "prefer-promise-reject-errors": "error",
    radix: "error",
    "sort-vars": "error",
    "symbol-description": "error",
    // typescript
    "typescript/ban-ts-comment": "error",
    "typescript/no-misused-promises": "error",
    "typescript/no-mixed-enums": "error",
    "typescript/no-unsafe-function-type": "error",
    "typescript/prefer-enum-initializers": "error",
    "typescript/prefer-includes": "error",
    "typescript/prefer-promise-reject-errors": "error",
    "typescript/prefer-ts-expect-error": "error",
    "typescript/related-getter-setter-pairs": "error",
    // unicorn
    "unicorn/consistent-assert": "error",
    "unicorn/consistent-empty-array-spread": "error",
    "unicorn/escape-case": "error",
    "unicorn/new-for-builtins": "error",
    "unicorn/no-hex-escape": "error",
    "unicorn/no-immediate-mutation": "error",
    "unicorn/no-instanceof-array": "error",
    "unicorn/no-negation-in-equality-check": "error",
    "unicorn/no-new-buffer": "error",
    "unicorn/no-static-only-class": "error",
    "unicorn/no-this-assignment": "error",
    "unicorn/no-typeof-undefined": "error",
    "unicorn/no-unnecessary-array-flat-depth": "error",
    "unicorn/no-unnecessary-array-splice-count": "error",
    "unicorn/no-unnecessary-slice-end": "error",
    "unicorn/no-unreadable-iife": "error",
    "unicorn/no-useless-promise-resolve-reject": "error",
    "unicorn/prefer-array-flat": "error",
    "unicorn/prefer-blob-reading-methods": "error",
    "unicorn/prefer-date-now": "error",
    "unicorn/prefer-dom-node-append": "error",
    "unicorn/prefer-dom-node-dataset": "error",
    "unicorn/prefer-dom-node-remove": "error",
    "unicorn/prefer-import-meta-properties": "error",
    "unicorn/prefer-math-min-max": "error",
    "unicorn/prefer-math-trunc": "error",
    "unicorn/prefer-native-coercion-functions": "error",
    "unicorn/prefer-number-coercion": "error",
    "unicorn/prefer-prototype-methods": "error",
    "unicorn/prefer-query-selector": "error",
    "unicorn/prefer-regexp-test": "error",
    "unicorn/prefer-single-call": "error",
    "unicorn/prefer-string-slice": "error",
    "unicorn/prefer-type-error": "error",
    "unicorn/require-number-to-fixed-digits-argument": "error",

    // --- restriction — bans a language or library feature outright (38 rules) ---
    // import
    "import/extensions": "error",
    "import/no-amd": "error",
    "import/no-commonjs": "error",
    "import/no-dynamic-require": "error",
    "import/no-webpack-loader-syntax": "error",
    // eslint
    "no-div-regex": "error",
    "no-empty": "error",
    "no-implicit-globals": "error",
    "no-param-reassign": "error",
    "no-proto": "error",
    "no-regex-spaces": "error",
    "no-sequences": "error",
    "no-var": "error",
    "unicode-bom": "error",
    // node
    "node/handle-callback-err": "error",
    "node/no-new-require": "error",
    "node/no-path-concat": "error",
    // oxc
    "oxc/bad-bitwise-operator": "error",
    "oxc/no-barrel-file": "error",
    "oxc/no-const-enum": "error",
    // promise
    "promise/spec-only": "error",
    // typescript
    "typescript/no-empty-object-type": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-invalid-void-type": "error",
    "typescript/no-non-null-asserted-nullish-coalescing": "error",
    "typescript/no-require-imports": "error",
    "typescript/no-var-requires": "error",
    "typescript/prefer-literal-enum-member": "error",
    // unicorn
    "unicorn/import-style": "error",
    "unicorn/no-abusive-eslint-disable": "error",
    "unicorn/no-anonymous-default-export": "error",
    "unicorn/no-length-as-slice-end": "error",
    "unicorn/no-magic-array-flat-depth": "error",
    "unicorn/no-useless-error-capture-stack-trace": "error",
    "unicorn/prefer-modern-math-apis": "error",
    "unicorn/prefer-module": "error",
    "unicorn/prefer-node-protocol": "error",
    "unicorn/prefer-number-properties": "error",

    // --- style — idiom, not correctness (115 rules) ---
    // eslint
    "default-case-last": "error",
    "default-param-last": "error",
    "func-name-matching": "error",
    "grouped-accessor-pairs": "error",
    "guard-for-in": "error",
    "logical-assignment-operators": "error",
    "no-extra-label": "error",
    "no-label-var": "error",
    "no-labels": "error",
    "no-lone-blocks": "error",
    "no-multi-str": "error",
    "no-new-func": "error",
    "no-return-assign": "error",
    "no-template-curly-in-string": "error",
    "no-useless-computed-key": "error",
    "object-shorthand": "error",
    "prefer-exponentiation-operator": "error",
    "prefer-numeric-literals": "error",
    "prefer-object-has-own": "error",
    "prefer-object-spread": "error",
    "prefer-regex-literals": "error",
    "prefer-rest-params": "error",
    "vars-on-top": "error",
    yoda: "error",
    // import
    "import/no-anonymous-default-export": "error",
    "import/no-duplicates": "error",
    "import/no-mutable-exports": "error",
    "import/no-named-default": "error",
    // node
    "node/exports-style": "error",
    "node/global-require": "error",
    "node/no-exports-assign": "error",
    "node/no-mixed-requires": "error",
    // promise
    "promise/no-nesting": "error",
    "promise/no-return-wrap": "error",
    "promise/prefer-catch": "error",
    // typescript
    "typescript/adjacent-overload-signatures": "error",
    "typescript/ban-tslint-comment": "error",
    "typescript/class-literal-property-style": "error",
    "typescript/consistent-generic-constructors": "error",
    "typescript/consistent-indexed-object-style": "error",
    "typescript/consistent-type-assertions": "error",
    "typescript/consistent-type-exports": "error",
    "typescript/method-signature-style": "error",
    "typescript/no-empty-interface": "error",
    "typescript/prefer-find": "error",
    "typescript/prefer-for-of": "error",
    "typescript/prefer-function-type": "error",
    "typescript/prefer-reduce-type-parameter": "error",
    "typescript/prefer-regexp-exec": "error",
    "typescript/prefer-return-this-type": "error",
    "typescript/prefer-string-starts-ends-with": "error",
    "typescript/unified-signatures": "error",
    // unicorn
    "unicorn/catch-error-name": "error",
    "unicorn/consistent-date-clone": "error",
    "unicorn/consistent-existence-index-check": "error",
    "unicorn/consistent-template-literal-escape": "error",
    "unicorn/custom-error-definition": "error",
    "unicorn/empty-brace-spaces": "error",
    "unicorn/error-message": "error",
    "unicorn/explicit-timer-delay": "error",
    "unicorn/no-console-spaces": "error",
    "unicorn/no-unreadable-array-destructuring": "error",
    "unicorn/no-zero-fractions": "error",
    "unicorn/prefer-array-index-of": "error",
    "unicorn/prefer-bigint-literals": "error",
    "unicorn/prefer-class-fields": "error",
    "unicorn/prefer-classlist-toggle": "error",
    "unicorn/prefer-default-parameters": "error",
    "unicorn/prefer-dom-node-text-content": "error",
    "unicorn/prefer-includes": "error",
    "unicorn/prefer-keyboard-event-key": "error",
    "unicorn/prefer-modern-dom-apis": "error",
    "unicorn/prefer-negative-index": "error",
    "unicorn/prefer-object-from-entries": "error",
    "unicorn/prefer-optional-catch-binding": "error",
    "unicorn/prefer-reflect-apply": "error",
    "unicorn/prefer-string-trim-start-end": "error",
    "unicorn/prefer-structured-clone": "error",
    "unicorn/relative-url-style": "error",
    "unicorn/require-module-attributes": "error",
    "unicorn/switch-case-break-position": "error",
    "unicorn/throw-new-error": "error",
    // vitest
    "vitest/consistent-each-for": "error",
    "vitest/consistent-test-filename": "error",
    "vitest/consistent-test-it": "error",
    "vitest/consistent-vitest-vi": "error",
    "vitest/max-nested-describe": "error",
    "vitest/no-alias-methods": "error",
    "vitest/no-duplicate-hooks": "error",
    "vitest/no-identical-title": "error",
    "vitest/no-import-node-test": "error",
    "vitest/no-interpolation-in-snapshots": "error",
    "vitest/no-large-snapshots": "error",
    "vitest/no-mocks-import": "error",
    "vitest/no-test-prefixes": "error",
    "vitest/no-test-return-statement": "error",
    "vitest/no-unneeded-async-expect-function": "error",
    "vitest/padding-around-after-all-blocks": "error",
    "vitest/padding-around-test-blocks": "error",
    "vitest/prefer-called-exactly-once-with": "error",
    "vitest/prefer-comparison-matcher": "error",
    "vitest/prefer-equality-matcher": "error",
    "vitest/prefer-expect-resolves": "error",
    "vitest/prefer-expect-type-of": "error",
    "vitest/prefer-hooks-in-order": "error",
    "vitest/prefer-hooks-on-top": "error",
    "vitest/prefer-importing-vitest-globals": "error",
    "vitest/prefer-mock-promise-shorthand": "error",
    "vitest/prefer-mock-return-shorthand": "error",
    "vitest/prefer-spy-on": "error",
    "vitest/prefer-to-be-object": "error",
    "vitest/prefer-to-contain": "error",
    "vitest/prefer-to-have-been-called-times": "error",
    "vitest/prefer-to-have-length": "error",
    "vitest/prefer-todo": "error",

    // --- nursery — new upstream rules; pinned individually, never as a category (5 rules) ---
    // import
    "import/export": "error",
    "import/named": "error",
    // eslint
    "no-unreachable-loop": "error",
    // promise
    "promise/no-return-in-finally": "error",
    // unicorn
    "unicorn/no-useless-iterator-to-array": "error",

    /**
     * Second pass: these had one to six findings each, all fixed or explicitly
     * suppressed at the site with a reason. Three rules were tried and rejected —
     * `no-alert` (the generic client's `confirm`/`prompt` flow is deliberate and
     * replacing it is UI work, not lint work), `node/callback-return` (fires on a
     * plain awaited call), and `typescript/no-dynamic-delete` (the script editor's
     * `delete layout[key]` on an index signature is the correct operation).
     */
    // pedantic
    "no-lonely-if": "error",
    "no-promise-executor-return": "error",
    "no-useless-return": "error",
    "typescript/no-unsafe-argument": "error",
    "typescript/restrict-plus-operands": "error",
    "unicorn/no-lonely-if": "error",
    "unicorn/no-object-as-default-parameter": "error",
    "unicorn/no-useless-switch-case": "error",
    "unicorn/prefer-array-some": "error",
    "unicorn/prefer-at": "error",
    // restriction
    "import/no-cycle": "error",
    "typescript/non-nullable-type-assertion-style": "error",
    "typescript/use-unknown-in-catch-callback-variable": "error",
    "unicorn/no-document-cookie": "error",
    // style
    "import/newline-after-import": "error",
    "no-multi-assign": "error",
    "no-script-url": "error",
    "promise/param-names": "error",
    "typescript/no-inferrable-types": "error",
    "unicorn/no-useless-collection-argument": "error",
    "unicorn/prefer-export-from": "error",
    "unicorn/prefer-logical-operator-over-ternary": "error",
    "unicorn/prefer-response-static-json": "error",
    // nursery
    "no-useless-assignment": "error",
    "typescript/prefer-optional-chain": "error",

    /**
     * Found by the three axes a plain tally does not cover: re-measuring the
     * `off` entries, trying a rule's option knobs before rejecting it, and
     * checking whether findings all sit in one directory (in which case the
     * rule goes on globally with a scoped override).
     */
    // pedantic
    "@typescript-eslint/unbound-method": "error",
    "unicorn/prefer-event-target": "error",
    // style — eslint core `prefer-spread` (`.apply()` → spread), which is a
    // different rule from `unicorn/prefer-spread`.
    "prefer-spread": "error",
    // restriction
    "import/unambiguous": "error",
    "promise/catch-or-return": "error",

    /**
     * Fix-then-enable. Each of these had a handful of findings, fixed or
     * suppressed at the site in the commit that pinned the rule.
     *
     * Four were tried and rejected upstream for reasons that are properties of
     * the tools rather than of one tree, so they are recorded here rather than
     * retried: `unicorn/prefer-spread` (its fix rewrites `str.split("")` to
     * `[...str]`, which the already-enabled `typescript/no-misused-spread` then
     * rejects — the two contradict each other on strings); `operator-assignment`
     * (its autofix can silently drop an `as number` assertion the site needs);
     * `unicorn/text-encoding-identifier-case` (rewrites the string value, so it
     * can "fix" a label while missing the actual `TextDecoder("utf-8")` call);
     * and `typescript/no-unnecessary-qualifier` (drops the `App.` in `app.d.ts`,
     * where an unqualified `Error` then shadows the built-in).
     */
    // pedantic
    "oxc/branches-sharing-code": "error",
    "typescript/ban-types": "error",
    "unicorn/prefer-code-point": "error",
    // style
    "prefer-arrow-callback": "error",
    "unicorn/prefer-global-this": "error",
    "unicorn/prefer-string-raw": "error",

    /**
     * Type-aware — these run through tsgolint, so they need `options.typeAware`
     * above and cost a type-check rather than a parse.
     *
     * `no-deprecated`'s only finding here is Sentry's `sendDefaultPii`, which is
     * suppressed at the site because the per-category `dataCollection` option
     * meant to replace it does not exist yet on the installed SDK. It is a
     * decision to revisit at the Sentry v11 bump, not a rename to apply.
     *
     * `unicorn/prefer-top-level-await` was rejected upstream for a reason that
     * still holds: it misreads Zod's `.catch(...)` as a promise chain.
     */
    "typescript/no-deprecated": "error",
    "typescript/only-throw-error": "error",
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
      rules: {
        "no-useless-assignment": "off",
        "no-undef": "off",
        // A plain `<script>` tag inside `<svelte:head>` is markup, not a
        // module, but the rule sees only the extracted source and asks for an
        // import or export to disambiguate it.
        "import/unambiguous": "off",
      },
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
    {
      // This suite exists to exercise the `thisArg` parameter the rule bans.
      files: ["src/lib/utils/array/array.test.ts"],
      rules: { "unicorn/no-array-method-this-argument": "off" },
    },
  ],
} satisfies OxlintConfig;
