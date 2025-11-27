import { EMAIL_FROM, RESEND_API_KEY } from "$env/static/private";
import { Log } from "$lib/utils/logger.util";
import { captureException } from "@sentry/sveltekit";
import { Context, Effect } from "effect";
import { Resend } from "resend";

// NOTE: Copied from nodemailer Mail.Options
export type SendEmailOptions = {
  /** The e-mail address of the sender. All e-mail addresses can be plain 'sender@server.com' or formatted 'Sender Name <sender@server.com>' */
  from?: string;
  /** Comma separated list or an array of recipients e-mail addresses that will appear on the To: field */
  to: string | string[];
  /** The subject of the e-mail */
  subject: string;
  /** The plaintext version of the message */
  text?: string;
  /** The HTML version of the message */
  html: string;
};

export class EmailService extends Context.Tag("EmailService")<
  EmailService,
  {
    readonly send: (input: SendEmailOptions) => Effect.Effect<void, { message: string }>;
  }
>() {}

const resend = new Resend(RESEND_API_KEY);
const of_resend: Context.Tag.Service<EmailService> = {
  send: (input) =>
    Effect.tryPromise({
      try: () =>
        resend.emails.send({
          to: input.to,
          subject: input.subject,
          from: input.from ?? EMAIL_FROM,

          text: input.text,
          html: input.html,
        }),

      catch: (error) => {
        Log.error(error, "EmailService.send.error");

        captureException(error);

        return { message: "Failed to send email" };
      },
    }),
};

const of_console_log: Context.Tag.Service<EmailService> = {
  send: (input) => Effect.sync(() => Log.info(input, "Sending email:")),
};

export const EmailLive = EmailService.of(of_resend);
export const EmailTest = EmailService.of(of_console_log);
