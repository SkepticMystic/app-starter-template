import { dev } from "$app/environment";
import { EMAIL_FROM, RESEND_API_KEY } from "$env/static/private";
import { APP } from "$lib/const/app.const";
import type { Branded } from "$lib/interfaces/zod/zod.type";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import * as Sentry from "@sentry/sveltekit";
import { captureException } from "@sentry/sveltekit";
import { Resend } from "resend";

const log = Log.child({ service: "EmailService" });

// NOTE: Copied from nodemailer Mail.Options
export type SendEmailOptions = {
  /** The e-mail address of the sender. All e-mail addresses can be plain 'sender@server.com' or formatted 'Sender Name <sender@server.com>'. Defaults to EMAIL_FROM. */
  from?: string;
  /** Comma separated list or an array of recipients e-mail addresses that will appear on the To: field */
  to: string | string[];
  /** The subject of the e-mail */
  subject: string;
  /** The plaintext version of the message */
  text?: string;
  /** The HTML version of the message */
  html: Branded<"SanitizedHTML">;
  /** File attachments (max 40MB total after base64 encoding) */
  attachments?: Array<{
    /** Name of the attached file */
    filename: string;
    /** File content as a Buffer or base64-encoded string */
    content: Buffer | string;
    /** MIME type; derived from filename if omitted */
    content_type?: string;
  }>;
  /** Resend tags for filtering/searching in the Resend dashboard (max 5) */
  tags?: Array<{ name: string; value: string }>;
  /** Tag used for the Sentry metric (e.g. "password-reset") */
  email_type?: string;
  /** ISO 8601 date string for deferred delivery (e.g. "2024-08-05T11:52:01.858Z") */
  scheduled_at?: string;
};

function format_from(from: string | undefined): string {
  const value = from ?? EMAIL_FROM;
  return value.includes("<") ? value : `${APP.NAME} <${value}>`;
}

const resend = new Resend(RESEND_API_KEY);
const of_resend = {
  send: async (input: SendEmailOptions) => {
    try {
      const start_ms = performance.now();
      const res = await resend.emails.send({
        to: input.to,
        text: input.text,
        html: input.html,
        subject: input.subject,
        attachments: input.attachments,
        tags: input.tags,
        scheduledAt: input.scheduled_at,
        from: format_from(input.from),
      });

      Sentry.metrics.distribution("email.send", performance.now() - start_ms, {
        unit: "millisecond",
        attributes: {
          email_type: input.email_type ?? "unknown",
          ok: !res.error,
        },
      });

      if (res.error) {
        log.error(res.error, "send.error response");

        captureException(res.error);

        return result.err({ message: "Failed to send email" });
      } else {
        return result.suc(res.data);
      }
    } catch (error) {
      log.error(error, "send.error unknown");

      captureException(error);

      return result.err({ message: "Failed to send email" });
    }
  },
};

const of_console_log = {
  send: async (input: SendEmailOptions) => log.info(input, "Sending email:"),
};

export const EmailService = dev ? of_console_log : of_resend;
