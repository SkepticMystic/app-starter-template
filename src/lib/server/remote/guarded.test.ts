import { getRequestEvent } from "$app/server";
import { auth } from "#lib/auth.js";
import {
  check_guard,
  define_guard,
  guarded_batch,
  guarded_command,
  guarded_form,
  guarded_query,
  USER,
} from "#lib/server/remote/guarded.js";
import { RateLimiter } from "#lib/server/services/rate_limit/rate_limit.service.js";
import { MembershipQuery } from "#lib/server/services/auth/membership.query.js";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vite-plus/test";
import { z } from "zod";
import { makeSession } from "../../../test/helpers.js";

// `$app/server`'s `command` / `query` / `form` are stubbed in `src/test/setup.ts`
// to hand back the handler they were given, so what `guarded_*` builds is
// called here as a plain function.
type Callable = (...args: unknown[]) => Promise<unknown>;
const call = (remote: unknown, ...args: unknown[]) =>
  (remote as Callable)(...args);

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const MEMBER_ID = "22222222-2222-4222-8222-222222222222";

const get_ba_session = vi.mocked(auth.api.getSession);
/**
 * Narrowed to the projection `read_session` asks for: `vi.mocked` erases the
 * generic `columns` to its constraint, which would demand a whole member row.
 */
const get_membership = vi.mocked(MembershipQuery.for_user) as unknown as Mock<
  () => Promise<App.Result<{ id: string; role: string } | undefined>>
>;

/**
 * Better-Auth's answer, and the membership `read_session` re-reads behind it:
 * by default the one the session claims, `null` for one that is gone.
 */
const signed_in = (
  session: App.Session | null,
  membership?: { id: string; role: string } | null,
) => {
  const claimed = session?.session.member_id
    ? {
        id: session.session.member_id,
        role: session.session.member_role ?? "owner",
      }
    : undefined;

  // A POST, so `read_session` reads afresh on every call rather than once per request.
  vi.mocked(getRequestEvent).mockReturnValue({
    locals: {},
    request: { method: "POST", headers: new Headers() },
  } as unknown as ReturnType<typeof getRequestEvent>);

  // A fresh copy per read: `read_session` writes the membership onto it.
  get_ba_session.mockImplementation(async () =>
    session ? structuredClone(session) : null,
  );
  get_membership.mockResolvedValue({
    ok: true,
    data: membership === undefined ? claimed : (membership ?? undefined),
  });
};

const limiter = new RateLimiter("test:guarded", {
  max_tokens: 1,
  refill_interval: 60,
});
const other = new RateLimiter("test:other", {
  max_tokens: 1,
  refill_interval: 60,
});

const consume = vi.spyOn(RateLimiter.prototype, "consume");

const ORG = define_guard({
  level: "org",
  limit: { limiter, by: "org", message: "Too many." },
});

const ok = <T>(data: T) => ({ ok: true as const, data });

const refuse_once = () =>
  consume.mockResolvedValueOnce({
    ok: true,
    data: { allowed: false, remaining: 0, retry_after_sec: 30 },
  });

beforeEach(() => {
  consume.mockResolvedValue({
    ok: true,
    data: { allowed: true, remaining: 1 },
  });

  signed_in(makeSession({ orgId: ORG_ID, memberId: MEMBER_ID }));
});

describe("guarded_*", () => {
  it("calls a schema'd handler with its input and the context", async () => {
    const fn = vi.fn((input: string, { org_id }: { org_id: string }) =>
      ok(`${input}@${org_id}`),
    );

    const res = await call(guarded_command(ORG, z.string(), fn), "x");

    expect(res).toEqual(ok(`x@${ORG_ID}`));
  });

  it("calls a schema-less handler with the context alone", async () => {
    const res = await call(guarded_query(ORG, ({ org_id }) => ok(org_id)));

    expect(res).toEqual(ok(ORG_ID));
  });

  it("returns a refusal and never runs the handler", async () => {
    signed_in(null);
    const fn = vi.fn(() => ok(1));

    const res = await call(guarded_command(ORG, z.string(), fn), "x");

    expect(res).toMatchObject({ ok: false, error: { status: 401 } });
    expect(fn).not.toHaveBeenCalled();
  });

  it("forwards a form's `issue` after the context", async () => {
    const issue = { marker: true };
    const fn = vi.fn(() => ok(1));

    await call(
      guarded_form(ORG, z.object({ a: z.string() }), fn),
      { a: "x" },
      issue,
    );

    expect(fn).toHaveBeenCalledWith(
      { a: "x" },
      expect.objectContaining({ org_id: ORG_ID }),
      issue,
    );
  });

  it("keeps kit's rule that a form boolean must be optional", () => {
    // An unchecked checkbox sends nothing, so a required boolean can never be false.
    // @ts-expect-error — the schema is replaced by kit's error message type
    const required = guarded_form(USER, z.object({ on: z.boolean() }), () =>
      ok(1),
    );

    const optional = guarded_form(
      USER,
      z.object({ on: z.boolean().default(false) }),
      () => ok(1),
    );

    expect([required, optional]).toHaveLength(2);
  });

  it("answers every item of a refused batch with the refusal", async () => {
    signed_in(null);

    const lookup = await call(
      guarded_batch(ORG, z.string(), () => () => ok(1)),
      ["a", "b"],
    );

    expect((lookup as (i: string) => unknown)("a")).toMatchObject({
      ok: false,
      error: { status: 401 },
    });
  });

  it("checks once per batch, not once per item", async () => {
    const lookup = await call(
      guarded_batch(
        ORG,
        z.string(),
        (inputs) => (input: string) => ok(inputs.indexOf(input)),
      ),
      ["a", "b"],
    );

    expect((lookup as (i: string) => unknown)("b")).toEqual(ok(1));
    expect(get_ba_session).toHaveBeenCalledTimes(1);
  });

  it("is unlimited with a spread `limit: []`", async () => {
    await call(guarded_command({ ...ORG, limit: [] }, () => ok(1)));

    expect(consume).not.toHaveBeenCalled();
  });
});

describe("check_guard — identity", () => {
  it("refuses a caller with no session, as a 401", async () => {
    signed_in(null);

    const res = await check_guard({ level: "user" });

    expect(!res.ok && res.error.status).toBe(401);
  });

  it("passes get_session its options, so a failed grant is its 403", async () => {
    signed_in(makeSession({ orgId: ORG_ID, memberRole: "member" }));

    const res = await check_guard({
      level: "org",
      session: { org_permissions: { invitation: ["create"] } },
    });

    expect(!res.ok && res.error.code).toBe("FORBIDDEN");
  });

  it("hands a user-level handler the user and the session", async () => {
    const res = await check_guard({ level: "user" });

    expect(res.ok && res.data).toMatchObject({
      user_id: "user-1",
      session: { user: { id: "user-1" } },
    });
  });

  it("lets a user-level caller through with no active organization", async () => {
    signed_in(makeSession({ orgId: null }));

    const res = await check_guard({ level: "user" });

    expect(res.ok).toBe(true);
  });

  it("refuses an org-level caller with no active organization", async () => {
    signed_in(makeSession({ orgId: null }));

    const res = await check_guard({ level: "org" });

    expect(!res.ok && res.error.code).toBe("FORBIDDEN");
  });

  it("hands an org-level handler the member", async () => {
    const res = await check_guard({ level: "org" });

    expect(res.ok && res.data).toMatchObject({
      user_id: "user-1",
      org_id: ORG_ID,
      member_id: MEMBER_ID,
      member_role: "owner",
    });
  });
});

/** `read_session` overwrites the cookie's org fields from the membership: the database wins. */
describe("check_guard — membership read fresh", () => {
  it("grants what a role promoted since sign-in allows", async () => {
    signed_in(
      makeSession({ orgId: ORG_ID, memberId: MEMBER_ID, memberRole: "member" }),
      { id: MEMBER_ID, role: "admin" },
    );

    const res = await check_guard({
      level: "org",
      session: { org_permissions: { invitation: ["create"] } },
    });

    expect(res.ok).toBe(true);
  });

  it("refuses what a role demoted since sign-in no longer allows", async () => {
    signed_in(
      makeSession({ orgId: ORG_ID, memberId: MEMBER_ID, memberRole: "owner" }),
      { id: MEMBER_ID, role: "member" },
    );

    const res = await check_guard({
      level: "org",
      session: { org_permissions: { organization: ["delete"] } },
    });

    expect(!res.ok && res.error.code).toBe("FORBIDDEN");
  });

  it("stops a session acting in an org it is no longer a member of", async () => {
    signed_in(makeSession({ orgId: ORG_ID, memberId: MEMBER_ID }), null);

    const res = await check_guard({ level: "org" });

    expect(!res.ok && res.error.code).toBe("FORBIDDEN");
  });
});

describe("check_guard — limits", () => {
  it.each([
    ["user", "user-1"],
    ["org", ORG_ID],
    ["member", MEMBER_ID],
  ] as const)("keys a `by: %s` bucket on that id", async (by, key) => {
    await check_guard({
      level: "org",
      limit: { limiter, by, message: "Slow down." },
    });

    expect(consume).toHaveBeenCalledWith(key, 1);
    expect(consume.mock.contexts[0]).toBe(limiter);
  });

  it("charges `tokens` rather than one", async () => {
    await check_guard({
      level: "org",
      limit: { limiter, by: "org", message: "Slow down.", tokens: 5 },
    });

    expect(consume).toHaveBeenCalledWith(ORG_ID, 5);
  });

  it("returns the limiter's own 429, message and wait included", async () => {
    refuse_once();

    const res = await check_guard({
      level: "org",
      limit: { limiter, by: "org", message: "Too many changes." },
    });

    expect(!res.ok && res.error).toMatchObject({
      status: 429,
      message: "Too many changes. Try again in 30s.",
    });
  });

  it("stops at the first refusal, so a later bucket is not spent", async () => {
    refuse_once();

    await check_guard({
      level: "org",
      limit: [
        { limiter, by: "org", message: "A." },
        { limiter: other, by: "org", message: "B." },
      ],
    });

    expect(consume).toHaveBeenCalledTimes(1);
    expect(consume.mock.contexts[0]).toBe(limiter);
  });

  it("spends nothing for a caller it has already refused", async () => {
    signed_in(makeSession({ orgId: null }));

    await check_guard({
      level: "org",
      limit: { limiter, by: "user", message: "A." },
    });

    expect(consume).not.toHaveBeenCalled();
  });
});

describe("check_guard — resolve", () => {
  it("merges what it resolves into the context", async () => {
    const res = await check_guard({
      level: "org",
      resolve: ({ org_id }) => ok({ scope: `org:${org_id}` }),
    });

    expect(res.ok && res.data).toMatchObject({
      org_id: ORG_ID,
      scope: `org:${ORG_ID}`,
    });
  });

  it("returns its refusal", async () => {
    const res = await check_guard({
      level: "org",
      resolve: () => ({
        ok: false,
        error: { message: "Upgrade your plan.", status: 402 },
      }),
    });

    expect(!res.ok && res.error.status).toBe(402);
  });

  it("does not run once a limit has refused", async () => {
    refuse_once();
    const resolve = vi.fn(() => ok({}));

    await check_guard({
      level: "org",
      limit: { limiter, by: "org", message: "A." },
      resolve,
    });

    expect(resolve).not.toHaveBeenCalled();
  });
});

describe("check_guard — authorize", () => {
  it("spends no bucket for a caller it refuses", async () => {
    const res = await check_guard({
      level: "org",
      authorize: () => ({
        ok: false,
        error: { message: "Forbidden", status: 403 },
      }),
      limit: { limiter, by: "org", message: "A." },
    });

    expect(!res.ok && res.error.status).toBe(403);
    expect(consume).not.toHaveBeenCalled();
  });

  it("hands resolve what it authorized, and merges both into the context", async () => {
    const resolve = vi.fn((ctx: { scope: string }) =>
      ok({ checked: `${ctx.scope}:ok` }),
    );

    const res = await check_guard({
      level: "org",
      authorize: ({ org_id }) => ok({ scope: `org:${org_id}` }),
      resolve,
    });

    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({ scope: `org:${ORG_ID}`, org_id: ORG_ID }),
    );
    expect(res.ok && res.data).toMatchObject({
      org_id: ORG_ID,
      scope: `org:${ORG_ID}`,
      checked: `org:${ORG_ID}:ok`,
    });
  });

  it("cannot overwrite a field of the principal the level vouched for", async () => {
    const res = await check_guard({
      level: "org",
      authorize: () => ok({ org_id: "forged" }),
    });

    expect(res.ok && res.data.org_id).toBe(ORG_ID);
  });
});
