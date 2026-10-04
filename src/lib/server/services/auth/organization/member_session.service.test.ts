import { APIError } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { betterAuth } from "better-auth/minimal";
import { describe, expect, it } from "vite-plus/test";
import {
  MemberSessionService,
  type SessionStore,
} from "./member_session.service.js";

/**
 * A real Better-Auth `internalAdapter`, configured as `auth.ts` is (sessions only in
 * `secondaryStorage`, with `org_id` and `member_role`), rather than a fake that agrees with us.
 */
const make_store = async () => {
  const kv = new Map<string, string>();

  const instance = betterAuth({
    baseURL: "http://localhost:5173",
    secret: "member-session-test-secret-0123456789abcdef",
    database: memoryAdapter({
      user: [],
      session: [],
      account: [],
      verification: [],
    }),
    secondaryStorage: {
      get: async (key) => kv.get(key) ?? null,
      set: async (key, value) => {
        kv.set(key, value);
      },
      delete: async (key) => {
        kv.delete(key);
      },
      getAndDelete: async (key) => {
        const value = kv.get(key) ?? null;
        kv.delete(key);
        return value;
      },
      increment: async (key) => {
        const next = Number(kv.get(key) ?? 0) + 1;
        kv.set(key, String(next));
        return next;
      },
    },
    session: {
      storeSessionInDatabase: false,
      additionalFields: {
        org_id: {
          type: "string",
          required: false,
          defaultValue: null,
          input: false,
        },
        member_role: {
          type: "string",
          required: false,
          defaultValue: null,
          input: false,
        },
      },
    },
    logger: { disabled: true },
  });

  const { internalAdapter } = await instance.$context;

  const user = await internalAdapter.createUser(
    { email: "agent@example.com", name: "Agent", emailVerified: true },
    { method: "email-password" },
  );

  /** Opens a session acting in `org_id` — what the `session.create` hook derives in `auth.ts`. */
  const open = async (org_id: string | null, member_role: string | null) => {
    const session = await internalAdapter.createSession(
      user.id,
      false,
      { org_id, member_role },
      true,
    );

    return session.token;
  };

  // As a record: `listSessions` is typed without the additional fields it returns.
  const live = async () =>
    Object.fromEntries(
      (await internalAdapter.listSessions(user.id)).map((s) => {
        const fields: Record<string, unknown> = s;

        return [
          s.token,
          { org_id: fields.org_id, member_role: fields.member_role },
        ];
      }),
    );

  return {
    store: internalAdapter satisfies SessionStore,
    user_id: user.id,
    open,
    live,
  };
};

const ORG = "org-a";
const OTHER_ORG = "org-b";

describe("MemberSessionService.revoke", () => {
  it("signs a removed member out of every session acting in that org, and no other", async () => {
    const { store, user_id, open, live } = await make_store();

    const laptop = await open(ORG, "admin");
    const phone = await open(ORG, "admin");
    const elsewhere = await open(OTHER_ORG, "owner");

    const res = await MemberSessionService.revoke(store, {
      user_id,
      org_id: ORG,
    });

    expect(res).toEqual({ ok: true, data: { revoked: 2 } });
    expect(Object.keys(await live())).toEqual([elsewhere]);
    await expect(store.findSession(laptop)).resolves.toBeNull();
    await expect(store.findSession(phone)).resolves.toBeNull();
  });

  it("leaves a session with no active org alone", async () => {
    const { store, user_id, open, live } = await make_store();

    // What Better-Auth leaves the remover's own session as when they remove themselves.
    const current = await open(null, null);

    const res = await MemberSessionService.revoke(store, {
      user_id,
      org_id: ORG,
    });

    expect(res).toEqual({ ok: true, data: { revoked: 0 } });
    expect(Object.keys(await live())).toEqual([current]);
  });

  it("reports a storage failure instead of throwing", async () => {
    const broken: SessionStore = {
      listSessions: async () => {
        throw new Error("redis down");
      },
      deleteSessions: async () => undefined,
      updateSession: async () => undefined,
    };

    const res = await MemberSessionService.revoke(broken, {
      user_id: "u1",
      org_id: ORG,
    });

    expect(res.ok).toBe(false);
  });
});

describe("MemberSessionService.set_role", () => {
  it("rewrites the role on sessions acting in that org, keeping them signed in", async () => {
    const { store, user_id, open, live } = await make_store();

    const laptop = await open(ORG, "admin");
    const elsewhere = await open(OTHER_ORG, "owner");

    const res = await MemberSessionService.set_role(store, {
      user_id,
      org_id: ORG,
      role: "member",
    });

    expect(res).toEqual({ ok: true, data: { updated: 1 } });
    await expect(live()).resolves.toEqual({
      [laptop]: { org_id: ORG, member_role: "member" },
      [elsewhere]: { org_id: OTHER_ORG, member_role: "owner" },
    });
  });
});

describe("MemberSessionService.after_endpoint", () => {
  it("revokes the leaver's sessions still acting in the org they left", async () => {
    const { store, user_id, open, live } = await make_store();

    // Better-Auth has already cleared the active org on the session that called `leave`.
    const caller = await open(null, null);
    await open(ORG, "member");

    await MemberSessionService.after_endpoint({
      path: "/organization/leave",
      returned: {
        id: "m1",
        userId: user_id,
        organizationId: ORG,
        role: "member",
      },
      store,
    });

    expect(Object.keys(await live())).toEqual([caller]);
  });

  it("does nothing when the leave failed, or for any other endpoint", async () => {
    const { store, user_id, open, live } = await make_store();

    const token = await open(ORG, "member");

    await MemberSessionService.after_endpoint({
      path: "/organization/leave",
      returned: new APIError("BAD_REQUEST"),
      store,
    });

    await MemberSessionService.after_endpoint({
      path: "/organization/set-active",
      returned: { id: "m1", userId: user_id, organizationId: ORG },
      store,
    });

    expect(Object.keys(await live())).toEqual([token]);
  });
});
