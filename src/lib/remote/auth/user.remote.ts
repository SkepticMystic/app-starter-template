import { form } from "$app/server";
import { auth } from "$lib/auth";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import z from "zod";

export const request_password_reset_remote = form(
  z.object({
    email: z.email("Please enter a valid email address"),
  }),
  async (input) => {
    try {
      const res = await auth.api.requestPasswordReset({
        body: { email: input.email },
      });

      return res.status
        ? result.suc({ message: res.message }) // 'If this email exists in our system, check your email for the reset link'
        : result.err({ message: "Failed to request password reset" });
    } catch (error) {
      Log.error(error, "request_password_reset_remote.error");

      return result.err({ message: "Internal server error" });
    }
  },
);

export const reset_password_remote = form(
  z.object({
    token: z.string(),
    new_password: z.string(),
  }),
  async (input) => {
    try {
      const res = await auth.api.resetPassword({
        body: {
          token: input.token,
          newPassword: input.new_password,
        },
      });

      return res.status ? result.suc() : result.err();
    } catch (error) {
      Log.error(error, "reset_password_remote.error");

      return result.err({ message: "Internal server error" });
    }
  },
);

export const send_verification_email_remote = form(
  z.object({
    email: z.email("Please enter a valid email address"),
  }),
  async (input) => {
    try {
      const res = await auth.api.sendVerificationEmail({
        body: { email: input.email, callbackURL: "/" },
      });

      return res.status
        ? result.suc({ message: "Verification email sent" })
        : result.err({ message: "Failed to send verification email" });
    } catch (error) {
      Log.error(error, "send_verification_email_remote.error");

      return result.err({ message: "Internal server error" });
    }
  },
);

export const change_password_remote = form(
  z.object({
    current_password: z.string(),
    new_password: z.string(),
  }),
  async (input) => {
    try {
      const res = await auth.api.changePassword({
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
      Log.error(error, "change_password_remote.error");

      return result.err({ message: "Internal server error" });
    }
  },
);
