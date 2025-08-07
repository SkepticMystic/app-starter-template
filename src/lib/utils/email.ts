import {
  EMAIL_FROM,
  SMTP_HOST,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  SMTP_PORT,
} from "$env/static/private";
import { Message, SMTPClient, type MessageHeaders } from "emailjs";
import z from "zod";

const config = z
  .object({
    EMAIL_FROM: z.email(),
    SMTP_HOST: z.string(),
    SMTP_USERNAME: z.string(),
    SMTP_PASSWORD: z.string(),
    SMTP_PORT: z.coerce.number().optional(),
  })
  .parse({
    EMAIL_FROM,
    SMTP_HOST,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    SMTP_PORT,
  });

const client = new SMTPClient({
  ssl: true,
  host: config.SMTP_HOST,
  user: config.SMTP_USERNAME,
  password: config.SMTP_PASSWORD,
  port: config.SMTP_PORT ?? 465,
});

export const Email = {
  send: ({ subject, text, to, attachment, from }: Partial<MessageHeaders>) => {
    const msg = new Message({
      to,
      text,
      subject,
      attachment,
      from: from ?? config.EMAIL_FROM,
    });

    const { isValid, validationError } = msg.checkValidity();
    console.assert(isValid, validationError);

    return client.sendAsync(msg);
  },
};
