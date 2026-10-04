import { getRequestEvent } from "$app/server";
import { auth } from "#lib/auth.js";
import type { RoleId } from "#lib/const/auth/role.const.js";
import { ServiceUtil } from "#lib/server/services/service.util.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";

const log = Log.child({ service: "Admin" });

/**
 * What the users table patches after a ban or unban. Better-Auth answers the
 * whole user row; this is the part that changed.
 */
type BanState = {
  user: { banned: boolean; banReason: string | null; banExpires: Date | null };
};

const ban_state = (user: {
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
}): BanState => ({
  user: {
    banned: user.banned ?? false,
    banReason: user.banReason ?? null,
    banExpires: user.banExpires ?? null,
  },
});

const set_role = async (input: {
  userId: string;
  role: RoleId;
}): Promise<App.Result<undefined>> => {
  try {
    await auth.api.setRole({
      body: input,
      headers: getRequestEvent().request.headers,
    });

    return result.suc(undefined);
  } catch (error) {
    return ServiceUtil.ba_error(error, {
      log: log.child({ method: "set_role" }),
    });
  }
};

/**
 * Swaps the session cookie for one acting as `user_id`, stashing the admin's
 * own in a signed cookie for {@link stop_impersonating}. Better-Auth answers
 * the new session, token included, so none of it is passed on.
 */
const impersonate = async (user_id: string): Promise<App.Result<undefined>> => {
  try {
    await auth.api.impersonateUser({
      body: { userId: user_id },
      headers: getRequestEvent().request.headers,
    });

    return result.suc(undefined);
  } catch (error) {
    return ServiceUtil.ba_error(error, {
      log: log.child({ method: "impersonate" }),
    });
  }
};

const stop_impersonating = async (): Promise<App.Result<undefined>> => {
  try {
    await auth.api.stopImpersonating({
      headers: getRequestEvent().request.headers,
    });

    return result.suc(undefined);
  } catch (error) {
    return ServiceUtil.ba_error(error, {
      log: log.child({ method: "stop_impersonating" }),
    });
  }
};

/** `banExpiresIn` is in seconds; unset bans until an admin unbans. */
const ban = async (input: {
  userId: string;
  banReason?: string | undefined;
  banExpiresIn?: number | undefined;
}): Promise<App.Result<BanState>> => {
  try {
    const res = await auth.api.banUser({
      body: input,
      headers: getRequestEvent().request.headers,
    });

    return result.suc(ban_state(res.user));
  } catch (error) {
    return ServiceUtil.ba_error(error, { log: log.child({ method: "ban" }) });
  }
};

const unban = async (user_id: string): Promise<App.Result<BanState>> => {
  try {
    const res = await auth.api.unbanUser({
      body: { userId: user_id },
      headers: getRequestEvent().request.headers,
    });

    return result.suc(ban_state(res.user));
  } catch (error) {
    return ServiceUtil.ba_error(error, {
      log: log.child({ method: "unban" }),
    });
  }
};

const remove = async (user_id: string): Promise<App.Result<undefined>> => {
  try {
    await auth.api.removeUser({
      body: { userId: user_id },
      headers: getRequestEvent().request.headers,
    });

    return result.suc(undefined);
  } catch (error) {
    return ServiceUtil.ba_error(error, {
      log: log.child({ method: "remove" }),
    });
  }
};

export const AdminService = {
  set_role,
  impersonate,
  stop_impersonating,
  ban,
  unban,
  remove,
};
