import { ERROR } from "$lib/const/error.const";
import { captureException } from "@sentry/sveltekit";
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";

/**
 * `src/test/setup.ts` mocks this module globally, so importing it normally here
 * would assert against the mock and pass whatever the real implementation did.
 */
let Repo: typeof import("./index.repo").Repo;
let PG_ERROR: typeof import("./index.repo").PG_ERROR;

beforeAll(async () => {
  ({ Repo, PG_ERROR } =
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

/**
 * The error ladder used to match substrings of the message, because the Neon
 * HTTP driver wrapped Postgres errors and left no code to switch on. `pg`
 * surfaces the SQLSTATE verbatim, so these assert the mapping that replaced it.
 *
 * A silent regression here turns every duplicate signup into a 500 instead of
 * "that email is already taken", which is why it is worth pinning.
 */
/** Shaped like a `pg` DatabaseError — `severity` is what identifies it. */
const pg_reject = (code: string, constraint?: string) =>
  Promise.reject(
    Object.assign(new Error("boom"), { severity: "ERROR", code, constraint }),
  );

describe("Repo error mapping", () => {
  beforeEach(() => {
    vi.mocked(captureException).mockClear();
  });

  it("answers DUPLICATE on a unique violation, without filing it", async () => {
    const res = await Repo.insert(
      pg_reject(PG_ERROR.UNIQUE_VIOLATION, "user_email_unique"),
    );

    expect(res).toMatchObject({ ok: false, error: ERROR.DUPLICATE });
    expect(captureException).not.toHaveBeenCalled();
  });

  it("answers DUPLICATE on an exclusion violation too", async () => {
    const res = await Repo.insert(pg_reject(PG_ERROR.EXCLUSION_VIOLATION));

    expect(res).toMatchObject({ ok: false, error: ERROR.DUPLICATE });
  });

  it("answers CONFLICT on a foreign-key violation during a delete", async () => {
    const res = await Repo.delete(pg_reject(PG_ERROR.FOREIGN_KEY_VIOLATION));

    expect(res).toMatchObject({ ok: false, error: ERROR.CONFLICT });
    expect(captureException).not.toHaveBeenCalled();
  });

  it("files a foreign-key violation on an insert — that one is our bug", async () => {
    const res = await Repo.insert(pg_reject(PG_ERROR.FOREIGN_KEY_VIOLATION));

    expect(res).toMatchObject({
      ok: false,
      error: ERROR.INTERNAL_SERVER_ERROR,
    });
    expect(captureException).toHaveBeenCalled();
  });

  it("maps a cancelled statement to TIMEOUT, and still files it", async () => {
    const res = await Repo.query(pg_reject(PG_ERROR.QUERY_CANCELED));

    expect(res).toMatchObject({ ok: false, error: ERROR.TIMEOUT });
    expect(captureException).toHaveBeenCalled();
  });

  it("maps a deadlock to CONFLICT so the caller can retry", async () => {
    const res = await Repo.query(pg_reject(PG_ERROR.DEADLOCK_DETECTED));

    expect(res).toMatchObject({ ok: false, error: ERROR.CONFLICT });
  });

  it("falls through to INTERNAL_SERVER_ERROR for a non-Postgres error", async () => {
    const res = await Repo.query(Promise.reject(new Error("socket hang up")));

    expect(res).toMatchObject({
      ok: false,
      error: ERROR.INTERNAL_SERVER_ERROR,
    });
    expect(captureException).toHaveBeenCalled();
  });

  it("unwraps a driver error nested in a wrapper's cause", async () => {
    const nested = Object.assign(new Error("drizzle wrapper"), {
      cause: Object.assign(new Error("boom"), {
        severity: "ERROR",
        code: PG_ERROR.UNIQUE_VIOLATION,
      }),
    });

    const res = await Repo.insert(Promise.reject(nested));

    expect(res).toMatchObject({ ok: false, error: ERROR.DUPLICATE });
  });
});
