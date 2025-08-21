import type { SID } from "$lib/interfaces";
import type { User } from "$lib/models/auth/User.model";
import { APP } from "./app";

const COMMON = {
  SIGNATURE: {
    TEXT: `
Kind regards,
${APP.NAME}
${APP.URL}
`.trim(),

    HTML: `
<p>
    Regards, <br />
    ${APP.NAME}
</p>`.trim(),
  },
};

export const EMAIL_TEMPLATES = {
  "password-reset": (data: { url: string; user: SID<User> }) => ({
    subject: `Reset your ${APP.NAME} password`,
    text: `
Hi,

Click here to reset your ${APP.NAME} password: ${data.url}.

If you did not request this, you can safely ignore this email.

${COMMON.SIGNATURE.TEXT}`.trim(),
    // attachment: {
    //   data: ``,
    //   alternative: true,
    // },
  }),

  "email-verification": (data: { url: string; user: User }) => ({
    subject: `Verify your ${APP.NAME} account`,
    text: `
Hi,

Click here to verify your ${APP.NAME} account: ${data.url}.

If you did not request this, you can safely ignore this email.

${COMMON.SIGNATURE.TEXT}`.trim(),
    // attachment: {
    //   data: ``,
    //   alternative: true,
    // },
  }),
} satisfies Record<
  string,
  (...args: any) => {
    subject: string;
    text: string;
    // attachment: { data: string; alternative: true };
  }
>;
