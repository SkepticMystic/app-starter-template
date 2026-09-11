import { getRequestEvent } from "$app/server";
import { ServiceUtil } from "$lib/server/services/service.util";
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

  permissions?: Parameters<
    typeof BetterAuthClient.admin.checkRolePermission
  >[0]["permissions"];
};

const authorize = (
  session: App.Session | null,
  options?: Options,
): App.Result<undefined> => {
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
    return ServiceUtil.ba_error(error, { log: l });
  }
};

export const authorize_event = (options?: Options): App.Result<undefined> => {
  const event = getRequestEvent();

  const session = event.locals.session ?? null;
  const check = authorize(session, options);

  return check;
};

/**
 * The current session, or the refusal to return to the caller.
 *
 * It RETURNS; it does not redirect — the old wording said "Redirect to signin
 * if not logged in", and code written against that turned a signed-out caller
 * into an error page.
 *
 * The two refusals mean different things and want different handling:
 * - `UNAUTHORIZED` — there is no session at all. Safe to answer by sending the
 *   caller to sign in.
 * - `FORBIDDEN` — there is a session and it is not allowed to do this
 *   (unverified email, no member role, a failed permission check). Signing in
 *   again fixes none of these, so redirecting to sign-in is a loop.
 */
export const get_session = async (
  options?: Options,
): Promise<App.Result<App.Session>> => {
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
