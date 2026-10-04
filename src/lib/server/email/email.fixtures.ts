import { APP } from "#lib/const/app.const.js";
import { TIME } from "#lib/const/time.const.js";
import { Format } from "#lib/utils/format.util.js";
import type { EmailProps, EmailType } from "./email.registry.js";

const USER = { name: "Ada Lovelace", email: "ada@example.com" };

/**
 * One believable set of props per template, for `/dev/emails` and the tests. Keyed by every
 * {@link EmailType}, so a template added without one does not type-check.
 */
export const EMAIL_FIXTURES = {
  "password-reset": {
    user: USER,
    url: `${APP.URL}/api/auth/reset-password/tok_reset?callbackURL=%2Fauth%2Freset-password`,
  },

  "email-verification": {
    user: USER,
    url: `${APP.URL}/api/auth/verify-email?token=tok_verify&callbackURL=%2Fhome`,
  },

  "org-invite": {
    organization: { name: "Acme Inc." },
    invitation: {
      id: "inv_123",
      email: "grace@example.com",
      role: "admin",
      expiresAt: new Date(Date.now() + 2 * TIME.DAY),
    },
    inviter: { user: USER },
  },

  "change-email-confirmation": {
    user: USER,
    new_email: "ada@newmail.example",
    url: `${APP.URL}/api/auth/verify-email?token=tok_change&callbackURL=%2Fsettings%2Faccount`,
  },

  "account-exists": { user: USER },

  "delete-account-verification": {
    user: USER,
    url: `${APP.URL}/api/auth/delete-user/callback?token=tok_delete`,
  },

  "user-deleted": { user: USER },

  "security-alert": {
    user: USER,
    to: USER.email,
    title: "New sign-in to your account",
    detail:
      "Your account was signed in to from a device it hasn't used recently, with a passkey.",
    when: Format.datetime_zoned(new Date()),
    device: "Firefox on macOS",
    location: "ZA",
  },

  "signin-code": { email: USER.email, code: "482913", expires_in_minutes: 10 },

  "admin-contact-form": {
    name: "Grace Hopper",
    email: "grace@example.com",
    message:
      "Hi there,\n\nDo you offer a discount for nonprofits?\nWe're a team of five.\n\nThanks,\nGrace",
  },
} satisfies { [K in EmailType]: EmailProps<K> };
