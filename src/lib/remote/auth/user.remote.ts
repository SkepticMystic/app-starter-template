import { form } from "$app/server";
import { redirect_uri_schema } from "#lib/schema/auth/redirect_uri.schema.js";
import {
  existing_password_schema,
  password_schema,
} from "#lib/schema/password/password.schema.js";
import {
  guarded_command,
  guarded_form,
  guarded_query,
  USER,
} from "#lib/server/remote/guarded.js";
import { AdapterService } from "#lib/server/services/adapter/adapter.service.js";
import { AccountDeletionService } from "#lib/server/services/auth/user/account_deletion.service.js";
import { AccountExportService } from "#lib/server/services/auth/user/account_export.service.js";
import { UserService } from "#lib/server/services/auth/user/user.service.js";
import { CaptchaService } from "#lib/server/services/captcha/captcha.service.js";
import { RateLimiter } from "#lib/server/services/rate_limit/rate_limit.service.js";
import { HashUtil } from "#lib/server/utils/hash.util.js";
import { invalid } from "@sveltejs/kit";
import { z } from "zod";

// An avatar that is not a dicebear URL costs a moderation call.
const update_user_limiter = new RateLimiter("user:update", {
  max_tokens: 10,
  refill_rate: 10,
  refill_interval: 300,
});

// Called directly, so Better-Auth's own router limit never applies. Per-IP
// caps a flood; per-address stops one inbox being bombed from many IPs.
const verification_ip_limiter = new RateLimiter("user:verify_email:ip", {
  max_tokens: 5,
  refill_rate: 5,
  refill_interval: 600,
});

const verification_email_limiter = new RateLimiter(
  "user:verify_email:address",
  { max_tokens: 3, refill_rate: 3, refill_interval: 3600 },
);

// A reset email, limited like a verification email: the answer is the same
// whether or not the address has an account, so both are spent on the attempt.
const reset_request_ip_limiter = new RateLimiter(
  "user:password_reset_request:ip",
  { max_tokens: 5, refill_rate: 5, refill_interval: 600 },
);

const reset_request_email_limiter = new RateLimiter(
  "user:password_reset_request:address",
  { max_tokens: 3, refill_rate: 3, refill_interval: 3600 },
);

// Redeeming a reset token: Better-Auth checks the token, this caps tries per IP.
const reset_ip_limiter = new RateLimiter("user:password_reset:ip", {
  max_tokens: 10,
  refill_rate: 10,
  refill_interval: 600,
});

// Each one emails the current address, and the new one after that.
const change_email_limiter = new RateLimiter("user:change_email", {
  max_tokens: 3,
  refill_rate: 3,
  refill_interval: 3600,
});

// A dozen reads in one transaction; plenty for someone taking their data.
const export_limiter = new RateLimiter("user:export", {
  max_tokens: 3,
  refill_rate: 3,
  refill_interval: 3600,
});

export const update_user_remote = guarded_form(
  {
    ...USER,
    limit: {
      limiter: update_user_limiter,
      by: "user",
      message: "Too many profile updates.",
    },
  },
  z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    image: z
      .union([
        z.url({ protocol: /^https$/ }).max(2048),
        z.literal("").transform(() => null),
      ])
      .optional(),
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
    const ip = AdapterService.get_ip();
    if (ip) {
      const rate = await reset_request_ip_limiter.enforce(ip, {
        message: "Too many password resets requested.",
      });
      if (!rate.ok) return rate;
    }

    const captcha = await CaptchaService.verify(input.captcha_token);
    if (!captcha.ok) return captcha;

    const address_rate = await reset_request_email_limiter.enforce(
      await HashUtil.email_key(input.email),
      { message: "Too many password resets requested for this address." },
    );
    if (!address_rate.ok) return address_rate;

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
    token: z.string().max(512),
    new_password: password_schema,
    captcha_token: z.string().min(1, "Please complete the captcha"),
  }),
  async (input) => {
    const ip = AdapterService.get_ip();
    if (ip) {
      const rate = await reset_ip_limiter.enforce(ip, {
        message: "Too many password reset attempts.",
      });
      if (!rate.ok) return rate;
    }

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
    redirect_uri: redirect_uri_schema(),
  }),
  async (input) => {
    const ip = AdapterService.get_ip();
    if (ip) {
      const rate = await verification_ip_limiter.enforce(ip, {
        message: "Too many verification emails requested.",
      });
      if (!rate.ok) return rate;
    }

    const rate = await verification_email_limiter.enforce(
      await HashUtil.email_key(input.email),
      { message: "Too many verification emails for this address." },
    );
    if (!rate.ok) return rate;

    const res = await UserService.send_verification_email(input);

    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

export const change_password_remote = guarded_form(
  USER,
  z.object({
    current_password: existing_password_schema,
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

export const change_email_remote = guarded_form(
  {
    ...USER,
    limit: {
      limiter: change_email_limiter,
      by: "user",
      message: "Too many email change requests.",
    },
  },
  z.object({
    new_email: z
      .email("Please enter a valid email address")
      .max(255)
      .brand<"EmailAddress">(),
  }),
  async (input, { user_id }) => {
    const res = await UserService.change_email({ ...input, user_id });

    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

/** A command, not a query: it is large, and fetched on a click rather than rendered. */
export const export_account_data_remote = guarded_command(
  {
    ...USER,
    limit: {
      limiter: export_limiter,
      by: "user",
      message: "Too many exports.",
    },
  },
  async ({ session }) => AccountExportService.for_user(session),
);

export const request_account_deletion_remote = guarded_command(USER, async () =>
  UserService.request_deletion(),
);

export const account_deletion_blockers_remote = guarded_query(
  USER,
  async ({ user_id }) => AccountDeletionService.blockers(user_id),
);
