import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { declared, variables } from "../env.js";

/**
 * `.env.example` is the onboarding manifest and the list `infra/` mirrors, so
 * it only stays useful if it cannot drift. `src/env.ts` declares every variable
 * the app can read — `$app/env/*` exposes nothing else — so the two must match.
 *
 * Keeping it honest by convention does not work — the file was missing
 * entirely before this test existed, while the README told people to copy it.
 */

const names = new Set(Object.keys(variables));

const read_documented_vars = () =>
  new Set(
    readFileSync(".env.example", "utf8")
      .split("\n")
      .map((line) => /^([A-Z][A-Z0-9_]*)=/.exec(line.trim())?.[1])
      .filter((key) => key !== undefined),
  );

describe("env.example", () => {
  it("documents every variable src/env.ts declares", () => {
    const documented = read_documented_vars();
    const undocumented = [...names]
      .filter((name) => !documented.has(name))
      .toSorted();

    expect(undocumented).toEqual([]);
  });

  it("documents nothing src/env.ts does not declare", () => {
    // An undeclared variable is unreadable, however it is set.
    const undeclared = [...read_documented_vars()]
      .filter((name) => !names.has(name))
      .toSorted();

    expect(undeclared).toEqual([]);
  });

  it("pins APP_ENV, which namespaces the shared Redis keyspace", () => {
    expect(read_documented_vars()).toContain("APP_ENV");
  });
});

const schema_of = (name: string) => {
  const config = declared.find(
    ([declared_name]) => declared_name === name,
  )?.[1];

  if (!config?.schema) throw new Error(`${name} has no schema`);

  return config.schema;
};

describe("variables", () => {
  it("rejects a missing or empty required variable", () => {
    expect(schema_of("DATABASE_URL").safeParse(undefined).success).toBe(false);
    expect(schema_of("BETTER_AUTH_SECRET").safeParse("").success).toBe(false);
  });

  it("reads an absent or empty optional variable as undefined", () => {
    for (const value of [undefined, ""]) {
      expect(schema_of("GOOGLE_CLIENT_ID").safeParse(value)).toMatchObject({
        success: true,
        data: undefined,
      });
    }
  });

  it("defaults the presentation-only variables", () => {
    expect(schema_of("LOG_LEVEL").parse(undefined)).toBe("info");
    expect(schema_of("NO_COLOR").parse(undefined)).toBe("false");
  });

  it("rejects a log level pino would not understand", () => {
    expect(schema_of("LOG_LEVEL").safeParse("verbose").success).toBe(false);
  });

  it("accepts only the three tiers the Redis prefix was built on", () => {
    expect(schema_of("APP_ENV").safeParse("prod").success).toBe(false);
    expect(schema_of("APP_ENV").safeParse("preview").success).toBe(true);
  });
});

/** The same invariants `pnpm env:check` enforces, so `pnpm test` catches them too. */
describe("declaration hygiene", () => {
  /** Kit renders it as the hover documentation at every import. */
  it("gives every variable a description", () => {
    const undocumented = declared
      .filter(([, config]) => !config.description?.trim())
      .map(([name]) => name);

    expect(undocumented).toStrictEqual([]);
  });

  /** The `public` flag decides visibility, not the prefix; this keeps them agreeing. */
  it("keeps the PUBLIC_ prefix and the public flag in agreement", () => {
    const mismatched = declared
      .filter(
        ([name, config]) =>
          name.startsWith("PUBLIC_") !== Boolean(config.public),
      )
      .map(([name]) => name);

    expect(mismatched).toStrictEqual([]);
  });

  /** Without one, kit silently means "set, but may be empty". */
  it("gives every variable a schema", () => {
    const unvalidated = declared
      .filter(([, config]) => !config.schema)
      .map(([name]) => name);

    expect(unvalidated).toStrictEqual([]);
  });
});
