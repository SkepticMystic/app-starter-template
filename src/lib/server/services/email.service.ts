import { dev } from "$app/env";
import { EMAIL_FROM, RESEND_API_KEY } from "$app/env/private";
import { APP } from "#lib/const/app.const.js";
import { ERROR } from "#lib/const/error.const.js";
import type { Branded } from "#lib/interfaces/zod/zod.type.js";
import { retry } from "#lib/utils/async/retry.util.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
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
  /** Where a reply goes, when not back to `from`: the submitter, on the contact form. */
  reply_to?: string;
  /** The subject of the e-mail */
  subject: string;
  /** The plaintext version of the message */
  text?: string;
  /** The HTML version of the message */
  html: Branded<"SanitizedHTML">;
  /** File attachments (max 40MB total after base64 encoding) */
  attachments?: {
    /** Name of the attached file */
    filename: string;
    /** File content as a Buffer or base64-encoded string */
    content: Buffer | string;
    /** MIME type; derived from filename if omitted */
    content_type?: string;
  }[];
  /** Resend tags for filtering/searching in the Resend dashboard (max 5) */
  tags?: { name: string; value: string }[];
  /** Tag used for the Sentry metric (e.g. "password-reset") */
  email_type?: string;
  /** ISO 8601 date string for deferred delivery (e.g. "2024-08-05T11:52:01.858Z") */
  scheduled_at?: string;
  /**
   * Resend answers a repeat of this key within 24h with the first send's result, so a retry
   * after a send that landed but timed out cannot deliver twice. At most 256 characters.
   */
  idempotency_key?: string;
};

function format_from(from: string | undefined): string {
  const value = from ?? EMAIL_FROM;
  return value.includes("<") ? value : `${APP.NAME} <${value}>`;
}

const resend = new Resend(RESEND_API_KEY);

type ResendSend = Awaited<ReturnType<typeof resend.emails.send>>;

/**
 * Refusals another attempt can fix. A quota or validation refusal answers the same again —
 * and a quota refusal is a 429 too, which is why this goes by name rather than status.
 * `application_error` is also what the SDK answers when the request never got a response.
 */
const TRANSIENT = new Set<string>([
  "rate_limit_exceeded",
  "concurrent_idempotent_requests",
  "application_error",
  "internal_server_error",
]);

const is_transient = (outcome: PromiseSettledResult<ResendSend>) => {
  if (outcome.status === "rejected") return true;

  const { error } = outcome.value;
  if (!error) return false;

  return TRANSIENT.has(error.name) || (error.statusCode ?? 0) >= 500;
};

const of_resend = {
  send: async (input: SendEmailOptions): Promise<App.Result<unknown>> => {
    const start_ms = performance.now();

    // Sends run deferred (Better-Auth's background tasks, `RuntimeService.defer`), so the
    // backoff is never a user's wait — except the contact form's, which accepts it.
    const { outcome, attempts } = await retry(
      () =>
        resend.emails.send(
          {
            to: input.to,
            replyTo: input.reply_to,
            text: input.text,
            html: input.html,
            subject: input.subject,
            attachments: input.attachments,
            tags: input.tags,
            scheduledAt: input.scheduled_at,
            from: format_from(input.from),
          },
          input.idempotency_key
            ? { idempotencyKey: input.idempotency_key }
            : undefined,
        ),
      {
        attempts: 3,
        should_retry: is_transient,
        delay_ms: (attempt) => attempt * 1000 + Math.random() * 250,
        on_retry: (failed, attempt) => {
          log.warn(
            {
              attempt,
              email_type: input.email_type,
              error:
                failed.status === "rejected"
                  ? failed.reason
                  : failed.value.error,
            },
            "send.retry",
          );
        },
      },
    );

    const ok = outcome.status === "fulfilled" && !outcome.value.error;

    Sentry.metrics.distribution("email.send", performance.now() - start_ms, {
      unit: "millisecond",
      attributes: {
        email_type: input.email_type ?? "unknown",
        ok,
        attempts,
      },
    });

    if (outcome.status === "rejected") {
      log.error(outcome.reason, "send.error unknown");

      captureException(outcome.reason);

      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to send email",
      });
    } else if (outcome.value.error) {
      log.error(outcome.value.error, "send.error response");

      captureException(outcome.value.error);

      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to send email",
      });
    } else {
      return result.suc(outcome.value.data);
    }
  },
};

/**
 * Answers like {@link of_resend}, so a caller that checks the result type-checks in both. Logs
 * the plain-text part, which reads every link, rather than the HTML.
 */
const of_console_log = {
  send: async (input: SendEmailOptions): Promise<App.Result<undefined>> => {
    log.info(
      {
        to: input.to,
        reply_to: input.reply_to,
        subject: input.subject,
        email_type: input.email_type,
      },
      `Email not sent (dev):\n\n${input.text ?? "(no plain-text part)"}\n`,
    );

    return result.suc(undefined);
  },
};

export const EmailService = dev ? of_console_log : of_resend;
