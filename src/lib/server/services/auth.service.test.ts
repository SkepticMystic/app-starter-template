import { getRequestEvent } from "$app/server";
import { auth } from "#lib/auth.js";
import { OrganizationRepo } from "#lib/server/db/repos/organization.repo.js";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { makeSession, with_request } from "../../../test/helpers.js";
import { authorize_event, get_session, read_session } from "./auth.service.js";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const MEMBER_ID = "22222222-2222-4222-8222-222222222222";

// `authorize_event` reads whatever `get_session` last stashed in locals.
const with_session = with_request;

const get_membership = vi.mocked(OrganizationRepo.get_membership);
const get_ba_session = vi.mocked(auth.api.getSession);

/** What Better-Auth hands back: a fresh object per call, as `read_session` mutates it. */
const signed_in = (session: () => App.Session | null) => {
  get_ba_session.mockImplementation(async () => session());
};

const event_for = (method: string) => {
  vi.mocked(getRequestEvent).mockReturnValue({
    locals: {},
    request: { method, headers: new Headers() },
  } as unknown as ReturnType<typeof getRequestEvent>);
};

beforeEach(() => {
  get_membership.mockResolvedValue({
    ok: true,
    data: { member_id: MEMBER_ID, role: "owner" },
  });
});

describe("authorize_event — org_permissions", () => {
  it("passes an admin asking to invite", () => {
    with_session(makeSession({ orgId: ORG_ID, memberRole: "admin" }));

    expect(
      authorize_event({ org_permissions: { invitation: ["create"] } }).ok,
    ).toBe(true);
  });

  it("refuses a member asking to invite", () => {
    with_session(makeSession({ orgId: ORG_ID, memberRole: "member" }));

    const res = authorize_event({
      org_permissions: { invitation: ["create"] },
    });

    expect(!res.ok && res.error.code).toBe("FORBIDDEN");
  });

  it("refuses a session with no membership at all", () => {
    with_session(makeSession({ orgId: null }));

    const res = authorize_event({
      org_permissions: { organization: ["update"] },
    });

    expect(!res.ok && res.error.code).toBe("FORBIDDEN");
  });

  it("is inert when no org_permissions are asked for", () => {
    with_session(makeSession({ orgId: null }));

    expect(authorize_event().ok).toBe(true);
  });

  it("refuses an unauthenticated request", () => {
    with_session(null);

    const res = authorize_event({
      org_permissions: { organization: ["update"] },
    });

    expect(!res.ok && res.error.code).toBe("UNAUTHORIZED");
  });

  it("does not let a global admin skip the org check", () => {
    with_session(
      makeSession({ orgId: ORG_ID, role: "admin", memberRole: "member" }),
    );

    expect(
      authorize_event({ org_permissions: { organization: ["delete"] } }).ok,
    ).toBe(false);
  });

  it("still refuses an unverified email before checking the org role", () => {
    with_session(
      makeSession({ orgId: ORG_ID, memberRole: "owner", emailVerified: false }),
    );

    const res = authorize_event({
      org_permissions: { organization: ["delete"] },
    });

    expect(!res.ok && res.error.message).toBe("Email not verified");
  });
});

describe("authorize_event — global role", () => {
  it("checks global permissions without the Better-Auth client", () => {
    with_session(makeSession({ role: "user" }));
    expect(authorize_event({ permissions: { user: ["ban"] } }).ok).toBe(false);

    with_session(makeSession({ role: "admin" }));
    expect(authorize_event({ permissions: { user: ["ban"] } }).ok).toBe(true);
  });
});

/** `read_session` overwrites the cookie's org fields from the membership: the database wins. */
describe("read_session — membership read fresh", () => {
  it("hands back the role as it is now, not as it was at sign-in", async () => {
    event_for("GET");
    signed_in(() => makeSession({ orgId: ORG_ID, memberRole: "member" }));
    get_membership.mockResolvedValue({
      ok: true,
      data: { member_id: MEMBER_ID, role: "admin" },
    });

    const res = await read_session();

    expect(res.ok && res.data?.session).toMatchObject({
      org_id: ORG_ID,
      member_id: MEMBER_ID,
      member_role: "admin",
    });
  });

  it("clears the org of a session whose membership is gone", async () => {
    event_for("GET");
    signed_in(() => makeSession({ orgId: ORG_ID }));
    get_membership.mockResolvedValue({ ok: true, data: undefined });

    const res = await read_session();

    expect(res.ok && res.data?.session).toMatchObject({
      org_id: null,
      member_id: null,
      member_role: null,
    });
  });

  it("does not look up a membership for a session with no org", async () => {
    event_for("GET");
    signed_in(() => makeSession({ orgId: null }));

    await read_session();

    expect(get_membership).not.toHaveBeenCalled();
  });

  it("returns the lookup's fault rather than trusting the cookie", async () => {
    event_for("GET");
    signed_in(() => makeSession({ orgId: ORG_ID }));
    get_membership.mockResolvedValue({
      ok: false,
      error: { status: 500, message: "db down" },
    });

    const res = await read_session();

    expect(res.ok).toBe(false);
  });

  it("refuses a gate the stale cookie role would have passed", async () => {
    event_for("POST");
    signed_in(() => makeSession({ orgId: ORG_ID, memberRole: "owner" }));
    get_membership.mockResolvedValue({
      ok: true,
      data: { member_id: MEMBER_ID, role: "member" },
    });

    const res = await get_session({
      org_permissions: { organization: ["delete"] },
    });

    expect(!res.ok && res.error.code).toBe("FORBIDDEN");
  });
});

describe("read_session — one read per GET", () => {
  it("shares one membership lookup between a GET's readers", async () => {
    signed_in(() => makeSession({ orgId: ORG_ID }));
    event_for("GET");

    const [first, second] = await Promise.all([read_session(), read_session()]);

    expect(first).toBe(second);
    expect(get_membership).toHaveBeenCalledOnce();
  });

  /** A command writes and may read again; it must see its own write. */
  it("reads afresh on every call in a POST", async () => {
    signed_in(() => makeSession({ orgId: ORG_ID }));
    event_for("POST");

    await read_session();
    await read_session();

    expect(get_membership).toHaveBeenCalledTimes(2);
  });
});
