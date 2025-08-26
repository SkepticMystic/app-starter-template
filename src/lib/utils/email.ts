import {
  EMAIL_FROM,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_USERNAME,
} from "$env/static/private";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import z from "zod";
import { err, suc } from "./result.util";

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

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT ?? 587,
  secure: config.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: config.SMTP_USERNAME,
    pass: config.SMTP_PASSWORD,
  },
});

const send = async (mail: Mail.Options) => {
  mail.from ??= config.EMAIL_FROM;

  try {
    const res = await transporter.sendMail(mail);

    return suc(res);
  } catch (error) {
    console.log("Email.send error", error);

    return err("Failed to send email");
  }
};

export const Email = {
  send,
};
