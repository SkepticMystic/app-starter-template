import { form, getRequestEvent } from "$app/server";
import { auth, BA_ERROR_CODES } from "$lib/auth";
import { App } from "$lib/utils/app";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { invalid } from "@sveltejs/kit";
import { APIError } from "better-auth";
import z from "zod";

export const request_password_reset_remote = form(
  z.object({ email: z.email("Please enter a valid email address") }),
  async (input) => {
    try {
      const res = await auth.api.requestPasswordReset({
        body: {
          email: input.email,
          redirectTo: App.url("/auth/reset-password"), // NOTE: Don't use `resolve`, since it outputs a path relative to the current file
        },
        headers: getRequestEvent().request.headers,
      });

      return res.status
        ? result.suc({ message: res.message }) // 'If this email exists in our system, check your email for the reset link'
        : result.err({ message: "Failed to request password reset" });
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "request_password_reset_remote.error better-auth");

        return result.err({ message: error.message });
      } else {
        Log.error(error, "request_password_reset_remote.error unknown");

        return result.err({ message: "Internal server error" });
      }
    }
  },
);

export const reset_password_remote = form(
  z.object({
    token: z.string(),
    new_password: z.string(),
  }),
  async (input, issue) => {
    try {
      const res = await auth.api.resetPassword({
        body: {
          token: input.token,
          newPassword: input.new_password,
        },
        headers: getRequestEvent().request.headers,
      });

      return res.status ? result.suc() : result.err();
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "reset_password_remote.error better-auth");

        if (
          error.body?.code === BA_ERROR_CODES.PASSWORD_TOO_LONG ||
          error.body?.code === BA_ERROR_CODES.PASSWORD_TOO_SHORT ||
          error.body?.code === BA_ERROR_CODES.PASSWORD_COMPROMISED
        ) {
          invalid(issue.new_password(error.message));
        }

        return result.err({ message: error.message });
      } else {
        Log.error(error, "reset_password_remote.error unknown");

        return result.err({ message: "Internal server error" });
      }
    }
  },
);

export const send_verification_email_remote = form(
  z.object({ email: z.email("Please enter a valid email address") }),
  async (input) => {
    try {
      const res = await auth.api.sendVerificationEmail({
        body: {
          callbackURL: "/",
          email: input.email,
        },
        headers: getRequestEvent().request.headers,
      });

      return res.status
        ? result.suc({ message: "Verification email sent" })
        : result.err({ message: "Failed to send verification email" });
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "send_verification_email_remote.error better-auth");

        return result.err({ message: error.message });
      } else {
        Log.error(error, "send_verification_email_remote.error unknown");

        return result.err({ message: "Internal server error" });
      }
    }
  },
);

export const change_password_remote = form(
  z.object({
    current_password: z.string(),
    new_password: z.string(),
  }),
  async (input, issue) => {
    try {
      const res = await auth.api.changePassword({
        headers: getRequestEvent().request.headers,
        body: {
          revokeOtherSessions: true,
          newPassword: input.new_password,
          currentPassword: input.current_password,
        },
      });

      Log.info(res, "change_password_remote.res");

      // return res.status
      return result.suc({ message: "Password changed successfully" });
      // : Result.err({ message: "Failed to change password" });
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "change_password_remote.error better-auth");

        if (error.body?.code === BA_ERROR_CODES.INVALID_PASSWORD) {
          invalid(issue.current_password(error.message));
        } else if (
          error.body?.code === BA_ERROR_CODES.PASSWORD_TOO_LONG ||
          error.body?.code === BA_ERROR_CODES.PASSWORD_TOO_SHORT ||
          error.body?.code === BA_ERROR_CODES.PASSWORD_COMPROMISED
        ) {
          invalid(issue.new_password(error.message));
        }

        return result.err({ message: error.message });
      } else {
        Log.error(error, "change_password_remote.error unknown");

        return result.err({ message: "Internal server error" });
      }
    }
  },
);
