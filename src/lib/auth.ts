import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "$env/static/private";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin, haveIBeenPwned, organization } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import mongoose from "mongoose";
import { APP } from "./const/app";
import { EMAIL } from "./const/email";
import { Email } from "./utils/email";

export const auth = betterAuth({
  appName: APP.NAME,

  database: mongodbAdapter(
    mongoose.connection as unknown as NonNullable<
      typeof mongoose.connection.db
    >,
  ),

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },

  user: {
    deleteUser: {
      enabled: true,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,

    sendResetPassword: async ({ user, url, token: _token }) => {
      await Email.send(EMAIL.TEMPLATES["password-reset"]({ url, user }));
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url, token: _token }) => {
      await Email.send(EMAIL.TEMPLATES["email-verification"]({ url, user }));
    },
  },

  socialProviders: {
    google:
      GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
        ? {
            // Always prompt the user to select an account
            prompt: "select_account",
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
          }
        : undefined,
  },

  plugins: [
    admin(),

    passkey({
      rpName: APP.NAME,
      rpID: new URL(APP.URL).hostname,
    }),

    haveIBeenPwned({
      customPasswordCompromisedMessage:
        "Your password has been compromised in a data breach. Please choose a different password.",
    }),

    organization({
      allowUserToCreateOrganization: true,

      // Doesn't seem to do anything?
      // SOURCE: https://github.com/better-auth/better-auth/blob/eb691e213dbe44a3c177d10a2dfd2f39ace0bf98/packages/better-auth/src/plugins/organization/types.ts#L340
      // autoCreateOrganizationOnSignUp: true,

      requireEmailVerificationOnInvitation: true,

      sendInvitationEmail: async (data) => {
        await Email.send(EMAIL.TEMPLATES["org-invite"](data));
      },
    }),
  ],

  // TODO: https://www.better-auth.com/docs/concepts/database#secondary-storage
  // secondaryStorage
});

//  === Remember ===
//  - Database indexes: https://www.better-auth.com/docs/guides/optimizing-for-performance#recommended-fields-to-index
