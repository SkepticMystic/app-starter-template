import { getRequestEvent } from "$app/server";
import { auth } from "#lib/auth.js";
import { ERROR } from "#lib/const/error.const.js";
import { ServiceUtil } from "#lib/server/services/service.util.js";
import { HashUtil } from "#lib/server/utils/hash.util.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { UserAgentUtil } from "#lib/utils/user_agent.util.js";

const log = Log.child({ service: "UserSession" });

/**
 * A user's own sessions, for "where am I signed in". Sessions live only in
 * Redis (`storeSessionInDatabase: false`), so Better-Auth's per-user list in
 * secondary storage is the source.
 *
 * A session's token is its bearer credential, so it never leaves the server:
 * each one is named by a hash of its token instead, and a revoke looks the
 * token back up from the caller's own list — so the hash can only ever reach
 * the caller's sessions.
 */

export type UserSession = {
  id: string;
  current: boolean;
  device: string;
  ip_address: string | null;
  country: string | null;
  created_at: Date;
  last_active_at: Date;
  expires_at: Date;
};

const public_id = async (token: string) =>
  (await HashUtil.sha256(token)).slice(0, 32);

/** Every live session, with the token each `id` stands for. */
const read = async () => {
  const sessions = await auth.api.listSessions({
    headers: getRequestEvent().request.headers,
  });

  return Promise.all(
    sessions.map(async (session) => ({
      token: session.token,
      session,
      id: await public_id(session.token),
    })),
  );
};

const list = async (
  session: App.Session,
): Promise<App.Result<UserSession[]>> => {
  try {
    const rows = await read();

    const sessions = rows
      .map(({ id, token, session: s }): UserSession => ({
        id,
        current: token === session.session.token,
        device: UserAgentUtil.describe(s.userAgent),
        ip_address: s.ipAddress ?? null,
        country: typeof s["country"] === "string" ? s["country"] : null,
        created_at: s.createdAt,
        last_active_at: s.updatedAt,
        expires_at: s.expiresAt,
      }))
      .toSorted(
        (a, b) =>
          Number(b.current) - Number(a.current) ||
          b.last_active_at.getTime() - a.last_active_at.getTime(),
      );

    return result.suc(sessions);
  } catch (error) {
    return ServiceUtil.ba_error(error, { log: log.child({ method: "list" }) });
  }
};

const revoke = async (
  id: string,
  session: App.Session,
): Promise<App.Result<null>> => {
  const l = log.child({ method: "revoke" });

  try {
    const target = (await read()).find((row) => row.id === id);
    if (!target) return result.err(ERROR.NOT_FOUND);

    if (target.token === session.session.token) {
      return result.err({
        ...ERROR.INVALID_INPUT,
        message: "That's this session. Sign out instead.",
      });
    }

    await auth.api.revokeSession({
      headers: getRequestEvent().request.headers,
      body: { token: target.token },
    });

    return result.suc(null);
  } catch (error) {
    return ServiceUtil.ba_error(error, { log: l });
  }
};

const revoke_others = async (): Promise<App.Result<null>> => {
  try {
    await auth.api.revokeOtherSessions({
      headers: getRequestEvent().request.headers,
    });

    return result.suc(null);
  } catch (error) {
    return ServiceUtil.ba_error(error, {
      log: log.child({ method: "revoke_others" }),
    });
  }
};

export const UserSessionService = {
  list,
  revoke,
  revoke_others,
};
