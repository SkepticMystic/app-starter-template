import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { variables } from "../env";

/**
 * `.env.example` is the onboarding manifest and the list `infra/` mirrors, so
 * it only stays useful if it cannot drift. `src/env.ts` declares every variable
 * the app can read — `$app/env/*` exposes nothing else — so the two must match.
 *
 * Keeping it honest by convention does not work — the file was missing
 * entirely before this test existed, while the README told people to copy it.
 */

const declared = new Set(Object.keys(variables));

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
    const undocumented = [...declared]
      .filter((name) => !documented.has(name))
      .toSorted();

    expect(undocumented).toEqual([]);
  });

  it("documents nothing src/env.ts does not declare", () => {
    // An undeclared variable is unreadable, however it is set.
    const undeclared = [...read_documented_vars()]
      .filter((name) => !declared.has(name))
      .toSorted();

    expect(undeclared).toEqual([]);
  });

  it("pins APP_ENV, which namespaces the shared Redis keyspace", () => {
    expect(read_documented_vars()).toContain("APP_ENV");
  });
});
