import { form } from "$app/server";
import { ERROR } from "#lib/const/error.const.js";
import { Mailer } from "#lib/server/email/email.mailer.js";
import { AdapterService } from "#lib/server/services/adapter/adapter.service.js";
import { CaptchaService } from "#lib/server/services/captcha/captcha.service.js";
import { RateLimiter } from "#lib/server/services/rate_limit/rate_limit.service.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { captureException } from "@sentry/sveltekit";
import { z } from "zod";

const rate_limiter = new RateLimiter("contact_us_remote", {
  max_tokens: 3,
  refill_rate: 1,
  refill_interval: 60,
});

export const contact_us_remote = form(
  z.object({
    name: z
      .string()
      .trim()
      .min(1, "Please enter your name")
      .max(100, "Name must be at most 100 characters"),
    email: z.email("Please enter a valid email address").max(255),
    message: z
      .string()
      .trim()
      .min(1, "Please enter a message")
      .max(5000, "Message must be at most 5000 characters"),
    captcha_token: z.string().min(1, "Please complete the captcha"),
  }),
  async (input) => {
    try {
      const ip = AdapterService.get_ip();
      if (!ip) {
        return result.err({
          ...ERROR.INTERNAL_SERVER_ERROR,
          message: "Failed to get IP address",
        });
      }

      // Before the captcha, so a flood is refused for the cost of a Redis read
      // rather than a Turnstile round trip.
      const rate_limit = await rate_limiter.enforce(ip);
      if (!rate_limit.ok) return rate_limit;

      const captcha = await CaptchaService.verify(input.captcha_token);
      if (!captcha.ok) return captcha;

      const sent = await Mailer.send("admin-contact-form", {
        name: input.name,
        email: input.email,
        message: input.message,
      });
      if (!sent.ok) return sent;

      return result.suc(undefined);
    } catch (error) {
      Log.error(error, "contact_us_remote.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  },
);
