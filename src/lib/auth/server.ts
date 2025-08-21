import { auth } from "$lib/auth";
import { ROUTES } from "$lib/const/routes.const";
import { App } from "$lib/utils/app";
import { Url } from "$lib/utils/urls";
import { error, redirect } from "@sveltejs/kit";

type Options = {
  /** Must be an admin */
  admin?: boolean;

  email_verified?: boolean;
};

/** Redirect to signin if not logged in. */
export const get_session = async (request: Request, options?: Options) => {
  const resolved = {
    admin: false,
    email_verified: true,
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
  }

  return session;
};
