import { form } from "$app/server";
import { EMAIL } from "$lib/const/email.const";
import { EmailService } from "$lib/services/email.service";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import z from "zod";

export const contact_us_remote = form(
  z.object({
    name: z.string().min(1, "Please enter your name"),
    email: z.email("Please enter a valid email address"),
    message: z.string().trim().min(1, "Please enter a message"),
  }),
  async (input) => {
    try {
      await EmailService.send(EMAIL.TEMPLATES["admin-contact-form"](input));

      return result.suc();
    } catch (error) {
      Log.error(error, "contact_us_remote.error unknown");

      captureException(error);

      return result.err({ message: "Internal server error" });
    }
  },
);
