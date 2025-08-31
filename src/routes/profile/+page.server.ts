import { auth } from "$lib/auth";
import { get_session } from "$lib/auth/server";
import { AuthSchema } from "$lib/schema/auth.schema";
import type { Actions } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { PageServerLoad } from "./$types";
import { err, suc } from "$lib/utils/result.util";

export const load = (async ({ request }) => {
  const [session, change_password_form_input, passkeys, accounts] =
    await Promise.all([
      get_session(request),
      superValidate(zod4(AuthSchema.change_password_form)),

      auth.api.listPasskeys({ headers: request.headers }),
      auth.api.listUserAccounts({ headers: request.headers }),
    ]);

  return {
    accounts,
    passkeys,
    user: session.user,
    forms: { change_password_form_input },
  };
}) satisfies PageServerLoad;

export const actions = {
  "change-password": async ({ request }) => {
    const form = await superValidate(
      request,
      zod4(AuthSchema.change_password_form),
    );
    console.log(form);

    if (!form.valid) {
      return message(form, err());
    }

    try {
      await auth.api.changePassword({
        headers: request.headers,
        body: {
          revokeOtherSessions: true,
          newPassword: form.data.new_password,
          currentPassword: form.data.current_password,
        },
      });
    } catch (error) {
      console.error(error);

      if (error instanceof APIError) {
        return message(form, err(error.message));
      } else {
        return message(form, err("Internal Server Error"), { status: 500 });
      }
    }

    return message(form, suc("Password changed successfully"));
  },
} satisfies Actions;
