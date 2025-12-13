import { form, getRequestEvent } from "$app/server";
import type { ResolvedPathname } from "$app/types";
import { auth, is_ba_error_code } from "$lib/auth";
import { AUTH } from "$lib/const/auth/auth.const";
import { ERROR } from "$lib/const/error.const";
import { App } from "$lib/utils/app";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { invalid, redirect } from "@sveltejs/kit";
import { zxcvbn } from "@zxcvbn-ts/core";
import { APIError } from "better-auth";
import z from "zod";

export const signin_credentials_remote = form(
  z.object({
    email: z.email("Please enter a valid email address"),
    password: z.string(),
    remember: z.boolean().default(false),
    redirect_uri: z.string().default("/"),
  }),
  async (input) => {
    let redirect_uri = input.redirect_uri as ResolvedPathname;

    try {
      const res = await auth.api.signInEmail({
        body: {
          email: input.email,
          password: input.password,
          rememberMe: input.remember,
        },
        headers: getRequestEvent().request.headers,
      });

      // WARN: When you call auth.api.signInEmail on the server,
      // and the user has 2FA enabled, it will return an object where twoFactorRedirect is set to true.
      // This behavior isn’t inferred in TypeScript, which can be misleading.
      // You can check using in instead to check if twoFactorRedirect is set to true.
      // SOURCE: https://www.better-auth.com/docs/plugins/2fa#sign-in-with-2fa
      if ("twoFactorRedirect" in res && res.twoFactorRedirect === true) {
        redirect_uri = App.url("/auth/two-factor", { redirect_uri });
      }
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "signin_remote.error better-auth");

        return result.err({ message: error.message });
      } else {
        Log.error(error, "signin_remote.error unknown");

        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }

    redirect(302, redirect_uri);
  },
);

export const signup_credentials_remote = form(
  z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: z.email("Please enter a valid email address"),
    password: z
      .string()
      .refine(
        (s) => zxcvbn(s).score >= AUTH.PASSWORD.MIN_SCORE,
        "Please choose a stronger password",
      ),
    remember: z.boolean().default(false),
    redirect_uri: z.string().default("/"),
  }),
  async (input, issue) => {
    try {
      await auth.api.signUpEmail({
        headers: getRequestEvent().request.headers,
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
          rememberMe: input.remember,
          callbackURL: input.redirect_uri,
        },
      });
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "signup_remote.error better-auth");

        if (is_ba_error_code(error, "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")) {
          invalid(issue.email(error.message));
        } else if (
          is_ba_error_code(
            error,
            "PASSWORD_TOO_LONG",
            "PASSWORD_TOO_SHORT",
            "PASSWORD_COMPROMISED",
          )
        ) {
          invalid(issue.password(error.message));
        }

        return result.err({ message: error.message });
      } else {
        Log.error(error, "signup_remote.error unknown");

        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }

    redirect(302, "/auth/verify-email");
  },
);
