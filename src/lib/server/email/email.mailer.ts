import type { Branded } from "#lib/interfaces/zod/zod.type.js";
import {
  EmailService,
  type SendEmailOptions,
} from "#lib/server/services/email.service.js";
import { ServiceUtil } from "#lib/server/services/service.util.js";
import { HashUtil } from "#lib/server/utils/hash.util.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { APP_ENV } from "$app/env/private";
import { render } from "svelte/server";
import {
  EMAILS,
  type EmailEntry,
  type EmailProps,
  type EmailType,
} from "./email.registry.js";
import { EMAIL_COLOR, EMAIL_HEAD_CSS } from "./email.theme.js";
import { EmailText } from "./email_text.util.js";

const log = Log.child({ service: "Mailer" });

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** For the two strings the shell writes itself; the body is escaped by Svelte. */
const escape = (value: string) =>
  value.replaceAll(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

/** Subjects and preheaders are one line, so a newline in a name cannot reach a header. */
const one_line = (value: string) => value.replaceAll(/\s+/g, " ").trim();

/**
 * Pads the preheader, so a client fills the rest of the inbox preview with blanks rather than
 * the first words of the body.
 */
const PREHEADER_PAD = "&#847;&zwnj;&nbsp;".repeat(60);

const wrap_document = (input: {
  subject: string;
  preheader: string;
  body: string;
}) => `<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escape(input.subject)}</title>
<style>${EMAIL_HEAD_CSS}</style>
</head>
<body class="email-page" style="margin:0;padding:0;background-color:${EMAIL_COLOR.page};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${escape(input.preheader)}${PREHEADER_PAD}</div>
${input.body}
</body>
</html>`;

type RenderedEmail = SendEmailOptions & {
  preheader: string;
  text: string;
};

/**
 * Renders `type`'s template into a whole message: the document around it, the plain-text
 * part, and the tags and idempotency key that identify it.
 */
const render_email = async <K extends EmailType>(
  type: K,
  props: EmailProps<K>,
): Promise<RenderedEmail> => {
  // An index by a generic key widens to the union of entries; `K` pins it back to one.
  const { component, envelope } = EMAILS[type] as unknown as EmailEntry<
    EmailProps<K>
  >;
  const env = envelope(props);
  const subject = one_line(env.subject);

  // Every comment goes, Svelte's hydration markers included: an email is never hydrated.
  // So a template cannot use Outlook's conditional comments.
  const body = (await render(component, { props })).body.replaceAll(
    /<!--[\s\S]*?-->/g,
    "",
  );

  const html = wrap_document({
    subject,
    preheader: one_line(env.preheader),
    body,
  }) as Branded<"SanitizedHTML">;

  // Each action link carries a fresh token, so the same content twice is a genuine repeat.
  const digest = await HashUtil.sha256(
    [[env.to].flat().join(","), subject, html].join("\n"),
  );

  return {
    to: env.to,
    reply_to: env.reply_to,
    subject,
    preheader: one_line(env.preheader),
    html,
    text: EmailText.from_html(body),
    email_type: type,
    tags: [
      { name: "type", value: type },
      { name: "env", value: APP_ENV },
    ],
    idempotency_key: `${type}/${digest}`,
  };
};

/** Renders and sends. A template that throws answers a 500, like a send that fails. */
const send = async <K extends EmailType>(
  type: K,
  props: EmailProps<K>,
): Promise<App.Result<unknown>> => {
  const email = await render_email(type, props).then(
    (rendered) => result.suc(rendered),
    (error: unknown) =>
      ServiceUtil.internal(error, { log, scope: "send", extra: { type } }),
  );
  if (!email.ok) return email;

  return await EmailService.send(email.data);
};

export const Mailer = { render: render_email, send };
