import { getRequestEvent } from "$app/server";
import type { ResolvedPathname } from "$app/types";
import { auth } from "$lib/auth";
import { BetterAuthClient } from "$lib/auth-client";
import type { RoleId } from "$lib/const/auth/role.const.ts";
import { Log } from "$lib/utils/logger.util";
import { error } from "@sveltejs/kit";
import { redirect } from "sveltekit-flash-message/server";

type Options = {
  /** Must be an admin */
  admin?: boolean;

  email_verified?: boolean;

  permissions?: Parameters<
    typeof BetterAuthClient.admin.checkRolePermission
  >[0]["permissions"];
};

/** Redirect to signin if not logged in. */
export const get_session = async (options?: Options) => {
  const event = getRequestEvent();

  const resolved = {
    admin: false,
    email_verified: true,
    permissions: undefined,
    ...(options ?? {}),
  };

  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  if (!session) {
    redirect(
      302,
      "/auth/signin" satisfies ResolvedPathname,
      {
        level: "warning",
        message: "Signin first to continue",
      },
      event,
    );
  } else if (
    !session.session.member_id ||
    !session.session.activeOrganizationId
  ) {
    error(401, "Unauthorized");
  } else if (resolved.email_verified && !session.user.emailVerified) {
    redirect(
      302,
      "/auth/verify-email" satisfies ResolvedPathname,
      {
        level: "warning",
        message: "Verify your email to continue",
      },
      event,
    );
  } else if (resolved.admin && session.user.role !== "admin") {
    error(403, "Forbidden");
  } else if (options?.permissions) {
    const role_check = BetterAuthClient.admin.checkRolePermission({
      permissions: options.permissions,
      role: (session.user.role as RoleId | undefined) || "user",
    });

    if (!role_check) {
      error(403, "Forbidden");
    }
  }

  return {
    user: session.user,
    session: {
      ...session.session,
      member_id: session.session.member_id!,
      org_id: session.session.activeOrganizationId,
    },
  };
};

export const safe_get_session = async (options?: Options) => {
  try {
    return await get_session(options);
  } catch (e) {
    Log.info(e, "safe_get_session error");

    return null;
  }
};
