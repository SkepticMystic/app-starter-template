import { beforeAll, describe, expect, it, vi } from "vite-plus/test";

/**
 * `src/test/setup.ts` mocks this module globally, so importing it normally here
 * would assert against the mock and pass whatever the real implementation did.
 */
let Repo: typeof import("./index.repo").Repo;

beforeAll(async () => {
  ({ Repo } =
    await vi.importActual<typeof import("./index.repo")>("./index.repo"));
});

describe("Repo.contains", () => {
  it("wraps an ordinary term in wildcards", () => {
    expect(Repo.contains("ross")).toBe("%ross%");
  });

  it("escapes a literal % so it cannot match every row", () => {
    // Unescaped, this is the bug: `%` matches everything, the full table comes
    // back, and `total` reports the unfiltered count as though it had filtered.
    expect(Repo.contains("%")).toBe(String.raw`%\%%`);
  });

  it("escapes a literal _ so it matches one underscore, not any character", () => {
    expect(Repo.contains("a_b")).toBe(String.raw`%a\_b%`);
  });

  it("escapes the backslash first, so it does not escape the escapes", () => {
    expect(Repo.contains(String.raw`a\b`)).toBe(String.raw`%a\\b%`);
  });

  it("handles a term combining all three", () => {
    expect(Repo.contains("50%_\\")).toBe(String.raw`%50\%\_\\%`);
  });
});
