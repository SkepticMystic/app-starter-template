import { getRequestEvent } from "$app/server";
import { auth } from "$lib/auth";
import { BetterAuthClient } from "$lib/auth-client";
import type { RoleId } from "$lib/const/auth/role.const";
import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException, metrics, setUser } from "@sentry/sveltekit";
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
    }

    if (resolved.admin && session.user.role !== "admin") {
      metrics.count("auth_admin_forbidden", 1, {
        attributes: { user_id: session.user.id },
      });
      return result.err(ERROR.FORBIDDEN);
    }

    if (options?.permissions) {
      if (!session.user.role) {
        metrics.count("auth_permissions_no_role", 1, {
          attributes: { user_id: session.user.id },
        });
        return result.err(ERROR.FORBIDDEN);
      }

      const role_check = BetterAuthClient.admin.checkRolePermission({
        permissions: options.permissions,
        role: session.user.role as RoleId,
      });

      if (!role_check) {
        metrics.count("auth_permissions_forbidden", 1, {
          attributes: {
            user_id: session.user.id,
            permissions: options.permissions,
          },
        });
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

    setUser({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    });

    return result.suc(session);
  } catch (error) {
    if (error instanceof APIError) {
      log.error(error.body, "get_session.error better-auth");

      captureException(error);

      return result.from_ba_error(error);
    } else {
      log.error(error, "get_session.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};
