import { dev } from "$app/environment";
import { EMAIL_FROM, RESEND_API_KEY } from "$env/static/private";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
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

const resend = new Resend(RESEND_API_KEY);
const of_resend = {
  send: async (input: SendEmailOptions) => {
    try {
      const res = await resend.emails.send({
        to: input.to,
        text: input.text,
        html: input.html,
        subject: input.subject,
        from: input.from ?? EMAIL_FROM,
      });

      if (res.error) {
        Log.error(res.error, "EmailService.send.error response");

        captureException(res.error);

        return result.err({ message: "Failed to send email" });
      } else {
        return result.suc(res.data);
      }
    } catch (error) {
      Log.error(error, "EmailService.send.error unknown");

      captureException(error);

      return result.err({ message: "Failed to send email" });
    }
  },
};

const of_console_log = {
  send: async (input: SendEmailOptions) => Log.info(input, "Sending email:"),
};

export const EmailService = dev ? of_console_log : of_resend;
