import { ERROR } from "#lib/const/error.const.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { captureException } from "@sentry/sveltekit";
import { z } from "zod";

const log = Log.child({ service: "MemberSession" });

/**
 * The slice of Better-Auth's `internalAdapter` this needs, passed in because importing
 * `#lib/auth` would be a cycle. `listSessions` returns each session's `org_id`.
 */
export type SessionStore = {
  listSessions: (
    user_id: string,
  ) => Promise<{ token: string; org_id?: string | null }[]>;
  deleteSessions: (tokens: string[]) => Promise<unknown>;
  updateSession: (
    token: string,
    data: { member_role: string },
  ) => Promise<unknown>;
};

type Membership = { user_id: string; org_id: string };

const tokens_in_org = async (store: SessionStore, input: Membership) => {
  const sessions = await store.listSessions(input.user_id);

  return sessions.filter((s) => s.org_id === input.org_id).map((s) => s.token);
};

/**
 * Signs a departed member out of every session acting in the org they left; sessions in other
 * orgs carry nothing from this membership. Sessions live only in Redis (`secondaryStorage`), so
 * this deletes them there; a browser holding the signed cookie cache keeps it until `maxAge`,
 * which is why `read_session` re-reads the membership regardless — this is the second line, so
 * the stored session stops claiming an org at all. Logs rather than throws: the member row is
 * already gone.
 */
const revoke = async (
  store: SessionStore,
  input: Membership,
): Promise<App.Result<{ revoked: number }>> => {
  const l = log.child({ method: "revoke", ...input });

  try {
    const tokens = await tokens_in_org(store, input);

    if (tokens.length > 0) await store.deleteSessions(tokens);

    l.info({ revoked: tokens.length }, "revoke.ok");

    return result.suc({ revoked: tokens.length });
  } catch (error) {
    l.error({ error }, "revoke.error");
    captureException(error, { extra: input });

    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Rewrites `member_role` in place on every session acting in this org. Without
 * `activeOrganizationId` the `session.update` hook does not re-derive over it. As {@link revoke},
 * within the cookie cache's `maxAge`, and logging rather than throwing.
 */
const set_role = async (
  store: SessionStore,
  input: Membership & { role: string },
): Promise<App.Result<{ updated: number }>> => {
  const l = log.child({ method: "set_role", ...input });

  try {
    const tokens = await tokens_in_org(store, input);

    await Promise.all(
      tokens.map((token) =>
        store.updateSession(token, { member_role: input.role }),
      ),
    );

    l.info({ updated: tokens.length }, "set_role.ok");

    return result.suc({ updated: tokens.length });
  } catch (error) {
    l.error({ error }, "set_role.error");
    captureException(error, { extra: input });

    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

const LeftMemberSchema = z.object({
  userId: z.string(),
  organizationId: z.string(),
});

const LEAVE_PATH = "/organization/leave";

/**
 * {@link revoke} for a member who left on their own: Better-Auth fires no organization hook for
 * `leaveOrganization`. `returned` may be an `APIError`, so it is parsed, not trusted.
 */
const after_endpoint = async (input: {
  path: string | undefined;
  returned: unknown;
  store: SessionStore;
}): Promise<void> => {
  if (input.path !== LEAVE_PATH) return;

  const left = LeftMemberSchema.safeParse(input.returned);
  if (!left.success) return;

  await revoke(input.store, {
    user_id: left.data.userId,
    org_id: left.data.organizationId,
  });
};

export const MemberSessionService = {
  revoke,
  set_role,
  after_endpoint,
};
