import { dev } from "$app/env";
import { ERROR } from "#lib/const/error.const.js";
import { EMAIL_FIXTURES } from "#lib/server/email/email.fixtures.js";
import { Mailer } from "#lib/server/email/email.mailer.js";
import { is_email_type } from "#lib/server/email/email.registry.js";
import { raise } from "#lib/utils/result.util.js";
import type { RequestHandler } from "./$types";

/** One template as it would be sent: the HTML document, or its text part with `?format=text`. */
export const GET: RequestHandler = async ({ params, url }) => {
  if (!dev || !is_email_type(params.type)) raise(ERROR.NOT_FOUND);

  const email = await Mailer.render(params.type, EMAIL_FIXTURES[params.type]);
  const as_text = url.searchParams.get("format") === "text";

  return new Response(as_text ? email.text : email.html, {
    headers: {
      "content-type": as_text
        ? "text/plain; charset=utf-8"
        : "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};
