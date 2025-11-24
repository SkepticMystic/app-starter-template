import { resolve } from "$app/paths";
import { form } from "$app/server";
import { auth } from "$lib/auth";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { redirect } from "@sveltejs/kit";
import { APIError } from "better-auth";
import z from "zod";

export const signin_credentials_remote = form(
  z.object({
    email: z.email("Please enter a valid email address"),
    password: z.string(), // NOTE: Better-auth will do validation, so no need to do it here
    remember: z.boolean().default(false),
    redirect_uri: z.string().default("/"),
  }),
  async (input) => {
    try {
      await auth.api.signInEmail({
        body: {
          email: input.email,
          password: input.password,
          rememberMe: input.remember,
        },
      });
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error, "signin_remote.error better-auth");

        return result.err({ message: error.message });
      } else {
        Log.error(error, "signin_remote.error unknown");

        return result.err({ message: "Internal server error" });
      }
    }

    redirect(302, input.redirect_uri);
  },
);

export const signup_credentials_remote = form(
  z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: z.email("Please enter a valid email address"),
    password: z.string(), // NOTE: Better-auth will do validation, so no need to do it here
    remember: z.boolean().default(false),
    redirect_uri: z.string().default("/"),
  }),
  async (input) => {
    try {
      await auth.api.signUpEmail({
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
        return result.err({ message: error.message });
      } else {
        Log.error(error, "signup_remote.error");

        return result.err({ message: "Internal server error" });
      }
    }

    redirect(302, resolve("/auth/verify-email"));
  },
);
