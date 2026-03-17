import { form } from "$app/server";
import { password_schema } from "$lib/schema/password/password.schema";
import { UserService } from "$lib/server/services/auth/user/user.service";
import { CaptchaService } from "$lib/server/services/captcha/captcha.service";
import { invalid } from "@sveltejs/kit";
import { z } from "zod";

export const update_user_remote = form(
  z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    image: z.union([z.url(), z.literal("").transform(() => null)]).optional(),
  }),
  async (input) => {
    const res = await UserService.update(input);

    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

export const request_password_reset_remote = form(
  z.object({
    email: z.email("Please enter a valid email address"),
    captcha_token: z.string().min(1, "Please complete the captcha"),
  }),
  async (input) => {
    const captcha = await CaptchaService.verify(input.captcha_token);
    if (!captcha.ok) return captcha;

    const res = await UserService.request_password_reset({
      email: input.email,
    });
    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

export const reset_password_remote = form(
  z.object({
    token: z.string(),
    new_password: password_schema,
    captcha_token: z.string().min(1, "Please complete the captcha"),
  }),
  async (input) => {
    const captcha = await CaptchaService.verify(input.captcha_token);
    if (!captcha.ok) return captcha;

    const res = await UserService.reset_password(input);

    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

export const send_verification_email_remote = form(
  z.object({
    email: z.email("Please enter a valid email address"),
    redirect_uri: z.string().default("/onboarding"),
  }),
  async (input) => {
    const res = await UserService.send_verification_email(input);

    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

export const change_password_remote = form(
  z.object({
    current_password: z.string(),
    new_password: password_schema,
  }),
  async (input) => {
    const res = await UserService.change_password(input);

    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);
