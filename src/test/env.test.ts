import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vite-plus/test";

/**
 * `.env.example` is the onboarding manifest and the list `infra/` mirrors, so
 * it only stays useful if it cannot drift. This walks `src/` for the variables
 * the app actually reads and asserts each one is documented.
 *
 * Keeping it honest by convention does not work — the file was missing
 * entirely before this test existed, while the README told people to copy it.
 */

// `import.meta.env.*` build flags, not environment variables.
const VITE_BUILTINS = new Set(["DEV", "PROD", "SSR", "MODE", "BASE_URL"]);

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entry_path = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(entry_path);
    return /\.(ts|svelte)$/.test(entry.name) ? [entry_path] : [];
  });

const read_used_vars = () => {
  const used = new Set<string>();

  for (const file of walk("src")) {
    if (file.startsWith(path.join("src", "test"))) continue;
    const source = readFileSync(file, "utf8");

    for (const [, name] of source.matchAll(/\benv\.([A-Z][A-Z0-9_]*)\b/g)) {
      if (name && !VITE_BUILTINS.has(name)) used.add(name);
    }
    for (const [name] of source.matchAll(/\bPUBLIC_[A-Z0-9_]+\b/g)) {
      used.add(name);
    }
  }

  return used;
};

const read_documented_vars = () =>
  new Set(
    readFileSync(".env.example", "utf8")
      .split("\n")
      .map((line) => /^([A-Z][A-Z0-9_]*)=/.exec(line.trim())?.[1])
      .filter((key) => key !== undefined),
  );

describe("env.example", () => {
  it("documents every variable src/ reads", () => {
    const documented = read_documented_vars();
    const undocumented = [...read_used_vars()]
      .filter((name) => !documented.has(name))
      .toSorted();

    expect(undocumented).toEqual([]);
  });

  it("pins APP_ENV, which namespaces the shared Redis keyspace", () => {
    expect(read_documented_vars()).toContain("APP_ENV");
  });
});
