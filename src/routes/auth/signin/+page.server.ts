import { auth } from "$lib/auth.js";
import { ROUTES } from "$lib/const/routes.const.js";
import { AuthSchema } from "$lib/schema/auth.schema.js";
import { Parsers } from "$lib/schema/parsers.js";
import { fail, redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import z from "zod";
import type { PageServerLoad } from "./$types.js";
import { App } from "$lib/utils/app.js";
import { TOAST } from "$lib/const/toast.const.js";

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
      return fail(400, { form });
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
        return fail(400, { form, message: error.message });
      } else {
        return fail(500, { form, message: "Internal Server Error" });
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
