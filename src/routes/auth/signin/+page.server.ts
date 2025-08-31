import { auth } from "$lib/auth.js";
import { ROUTES } from "$lib/const/routes.const.js";
import { TOAST } from "$lib/const/toast.const.js";
import { AuthSchema } from "$lib/schema/auth.schema.js";
import { Parsers } from "$lib/schema/parsers.js";
import { App } from "$lib/utils/app.js";
import { redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { message, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import z from "zod";
import type { PageServerLoad } from "./$types.js";
import { err } from "$lib/utils/result.util.js";

export const load = (async ({ url }) => {
  const search = Parsers.url(
    url,
    z.object({ redirect_uri: z.string() }).partial(),
  );

  const form_input = await superValidate(zod4(AuthSchema.signin_form));

  return {
    search,
    form_input,
  };
}) satisfies PageServerLoad;

export const actions = {
  default: async ({ request, url }) => {
    const search = Parsers.url(
      url,
      z.object({ redirect_uri: z.string() }).partial(),
    );

    const form = await superValidate(request, zod4(AuthSchema.signin_form));
    console.log(form);

    if (!form.valid) {
      return message(form, err());
    }

    try {
      await auth.api.signInEmail({
        headers: request.headers,
        body: {
          email: form.data.email,
          password: form.data.password,
          rememberMe: form.data.remember,
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

    redirect(
      303,
      App.url(search.redirect_uri ?? ROUTES.HOME, {
        toast: TOAST.IDS.SIGNED_IN,
      }),
    );
  },
};
