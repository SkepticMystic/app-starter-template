import { getRequestEvent } from "$app/server";
import { auth } from "$lib/auth";
import { BetterAuthClient } from "$lib/auth-client";
import type { RoleId } from "$lib/const/auth/role.const.ts";
import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { error } from "@sveltejs/kit";
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
  session: Awaited<ReturnType<typeof auth.api.getSession>>,
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
    } else if (
      !session.session.member_id ||
      !session.session.member_role ||
      !session.session.activeOrganizationId
    ) {
      return result.err({
        ...ERROR.FORBIDDEN,
        message: "Complete onboarding to continue",
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

    return result.suc();
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

export const authorize_event = async (options?: Options) => {
  const event = getRequestEvent();

  const session = event.locals.session ?? null;
  const check = authorize(session, options);
  if (!check.ok) {
    error(check.error?.status ?? 403, check.error);
  }
};

/** Redirect to signin if not logged in. */
export const get_session = async (options?: Options) => {
  const event = getRequestEvent();

  const session = await auth.api.getSession({
    headers: event.request.headers,
  });
  if (!session) {
    error(401, ERROR.UNAUTHORIZED);
  }

  const check = authorize(session, options);
  if (!check.ok) {
    error(check.error?.status ?? 403, check.error);
  }

  const res = {
    user: session.user,
    session: {
      ...session.session,
      member_id: session.session.member_id!,
      member_role: session.session.member_role!,
      org_id: session.session.activeOrganizationId,
    },
  };

  event.locals.session = res;

  return res;
};

export const safe_get_session = async (options?: Options) => {
  try {
    return await get_session(options);
  } catch (e) {
    Log.info(e, "safe_get_session error");

    return null;
  }
};
