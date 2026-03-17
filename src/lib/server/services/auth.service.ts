import { getRequestEvent } from "$app/server";
import { auth } from "$lib/auth";
import { BetterAuthClient } from "$lib/auth-client";
import type { RoleId } from "$lib/const/auth/role.const";
import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";

const log = Log.child({ service: "Auth" });

type Options = {
  /** Must be an admin */
  admin?: boolean;

  email_verified?: boolean;

  permissions?: Parameters<typeof BetterAuthClient.admin.checkRolePermission>[0]["permissions"];
};

const authorize = (session: App.Session | null, options?: Options): App.Result<undefined> => {
  const l = log.child({ method: "authorize" });

  try {
    if (!session) {
      return result.err(ERROR.UNAUTHORIZED);
    }

    const resolved = {
      admin: false,
      email_verified: true,
      permissions: undefined,
      ...options,
    };

    if (resolved.email_verified && !session.user.emailVerified) {
      return result.err({
        ...ERROR.FORBIDDEN,
        message: "Email not verified",
      });
    } else if (resolved.admin && session.user.role !== "admin") {
      return result.err(ERROR.FORBIDDEN);
    } else if (options?.permissions) {
      const role_check = BetterAuthClient.admin.checkRolePermission({
        permissions: options.permissions,
        role: (session.user.role as RoleId | undefined) || "user",
      });

      if (!role_check) {
        return result.err(ERROR.FORBIDDEN);
      }
    }

    return result.suc(undefined);
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      captureException(error);

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

export const authorize_event = (options?: Options): App.Result<undefined> => {
  const event = getRequestEvent();

  const session = event.locals.session ?? null;
  const check = authorize(session, options);

  return check;
};

/** Redirect to signin if not logged in. */
export const get_session = async (options?: Options): Promise<App.Result<App.Session>> => {
  try {
    const event = getRequestEvent();

    const session = await auth.api.getSession({
      headers: event.request.headers,
    });

    if (!session) {
      return result.err(ERROR.UNAUTHORIZED);
    }

    const check = authorize(session, options);
    if (!check.ok) return check;

    event.locals.session = session;

    return result.suc(session);
  } catch (error) {
    if (error instanceof APIError) {
      log.info(error.body, "get_session.error better-auth");

      captureException(error);

      return result.from_ba_error(error);
    } else {
      log.error(error, "get_session.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};
