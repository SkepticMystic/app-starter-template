import {
  EMAIL_FROM,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USERNAME,
} from "$env/static/private";
import { Log } from "$lib/utils/logger.util";
import { Context, Effect } from "effect";
import { SMTPClient } from "emailjs";
import z from "zod";

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
  html?: string;
};

export class EmailService extends Context.Tag("EmailService")<
  EmailService,
  {
    readonly send: (
      input: SendEmailOptions,
    ) => Effect.Effect<void, { message: string }>;
  }
>() {}

const config = z
  .object({
    SMTP_HOST: z.string(),
    SMTP_USERNAME: z.string(),
    SMTP_PASSWORD: z.string(),
    SMTP_PORT: z.coerce.number().default(465),
  })
  .parse({ SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, SMTP_PORT });

const client = new SMTPClient({
  port: config.SMTP_PORT,
  host: config.SMTP_HOST,
  user: config.SMTP_USERNAME,
  password: config.SMTP_PASSWORD,
  ssl: config.SMTP_PORT === 465,
});

const of_emailjs: Context.Tag.Service<EmailService> = {
  send: (input) =>
    Effect.gen(function* () {
      // Doesn't seem to work... docs say it loads from env by default, but this get never works
      //   const EMAIL_FROM = yield* Config.string("EMAIL_FROM").pipe(Effect.orDie);

      return Effect.tryPromise({
        try: () =>
          client.sendAsync({
            to: input.to,
            subject: input.subject,
            from: input.from ?? EMAIL_FROM,

            text: input.text ?? null,
            attachment: input.html
              ? [{ data: input.html, alternative: true }]
              : undefined,
          }),

        catch: (error) => {
          console.error("Failed to send email:", error);
          return { message: "Failed to send email" };
        },
      });
    }),
};

const of_console_log: Context.Tag.Service<EmailService> = {
  send: (input) => Effect.sync(() => Log.info(input, "Sending email:")),
};

export const EmailLive = EmailService.of(of_emailjs);
export const EmailTest = EmailService.of(of_console_log);
