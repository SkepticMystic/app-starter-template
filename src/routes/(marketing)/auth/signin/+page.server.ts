import { AUTH } from "#lib/const/auth/auth.const.js";
import type { PageServerLoad } from "./$types";

export const load = (({ cookies }) => {
  // Written by `lastLoginMethod`, but not httpOnly: only a known id is shown.
  const method = cookies.get(AUTH.LAST_LOGIN_METHOD_COOKIE);

  return {
    last_method: method && AUTH.is_sign_in_method(method) ? method : null,
  };
}) satisfies PageServerLoad;
