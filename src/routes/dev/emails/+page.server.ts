import { dev } from "$app/env";
import { ERROR } from "#lib/const/error.const.js";
import { EMAIL_FIXTURES } from "#lib/server/email/email.fixtures.js";
import { Mailer } from "#lib/server/email/email.mailer.js";
import { EMAIL_TYPES } from "#lib/server/email/email.registry.js";
import { raise } from "#lib/utils/result.util.js";
import type { PageServerLoad } from "./$types";

/** Every template, rendered with its fixture. Dev only: a built app answers 404. */
export const load: PageServerLoad = async () => {
  if (!dev) raise(ERROR.NOT_FOUND);

  const emails = await Promise.all(
    EMAIL_TYPES.map(async (type) => {
      const email = await Mailer.render(type, EMAIL_FIXTURES[type]);

      return {
        type,
        to: [email.to].flat().join(", "),
        reply_to: email.reply_to ?? null,
        subject: email.subject,
        preheader: email.preheader,
      };
    }),
  );

  return { emails };
};
