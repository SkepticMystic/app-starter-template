import { form } from "$app/server";
import { auth } from "$lib/auth";
import { Log } from "$lib/utils/logger.util";
import { Result } from "$lib/utils/result.util";
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
        ? Result.suc({ message: res.message }) // 'If this email exists in our system, check your email for the reset link'
        : Result.err({ message: "Failed to request password reset" });
    } catch (error) {
      Log.error(error, "request_password_reset_remote.error");

      return Result.err({ message: "Internal server error" });
    }
  },
);

export const reset_password_remote = form(
  z.object({
    token: z.string(),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
  }),
  async (input) => {
    try {
      const res = await auth.api.resetPassword({
        body: {
          token: input.token,
          newPassword: input.new_password,
        },
      });

      return res.status ? Result.suc() : Result.err();
    } catch (error) {
      Log.error(error, "reset_password_remote.error");

      return Result.err({ message: "Internal server error" });
    }
  },
);
