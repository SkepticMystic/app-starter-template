import { auth } from "$lib/auth";
import { BetterAuthClient } from "$lib/auth-client";
import type { IAccessControl } from "$lib/const/access_control.const";
import { ROUTES } from "$lib/const/routes.const";
import { App } from "$lib/utils/app";
import { Url } from "$lib/utils/urls";
import { error, redirect } from "@sveltejs/kit";

type Options = {
  /** Must be an admin */
  admin?: boolean;

  email_verified?: boolean;

  permissions?: Parameters<
    typeof BetterAuthClient.admin.checkRolePermission
  >[0]["permissions"];
};

/** Redirect to signin if not logged in. */
export const get_session = async (request: Request, options?: Options) => {
  const resolved = {
    admin: false,
    email_verified: true,
    permissions: undefined,
    ...(options ?? {}),
  };

  const redirect_uri = Url.strip_origin(new URL(request.url));

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    redirect(302, App.url(ROUTES.AUTH_SIGNIN, { redirect_uri }));
  } else if (resolved.email_verified && !session.user.emailVerified) {
    redirect(302, App.url(ROUTES.AUTH_VERIFY_EMAIL, { redirect_uri }));
  } else if (resolved.admin && session.user.role !== "admin") {
    error(403, "Forbidden");
  } else if (options?.permissions) {
    const role_check = BetterAuthClient.admin.checkRolePermission({
      permissions: options.permissions,
      role: (session.user.role as IAccessControl.RoleId | undefined) || "user",
    });

    if (!role_check) {
      error(403, "Forbidden");
    }
  }

  return session;
};
