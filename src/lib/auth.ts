import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "$env/static/private";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin, haveIBeenPwned, organization } from "better-auth/plugins";
import mongoose from "mongoose";
import { APP } from "./const/app";
import { ROUTES } from "./const/routes.const";
import { App } from "./utils/app";
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

    sendResetPassword: async ({ user, url, token: _token }, _request) => {
      await Email.send({
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url, token: _token }, _request) => {
      await Email.send({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      });
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

      sendInvitationEmail: async (data, _request) => {
        const url = App.full_url(ROUTES.AUTH_ORGANIZATION_ACCEPT_INVITE, {
          invite_id: data.invitation.id,
        });

        await Email.send({
          to: data.invitation.email,
          subject: "You have been invited to join an organization",
          text: `Click the link to accept the invitation: ${url}`,
        });
      },
    }),
  ],

  // TODO: https://www.better-auth.com/docs/concepts/database#secondary-storage
  // secondaryStorage
});

//  === Remember ===
//  - Database indexes: https://www.better-auth.com/docs/guides/optimizing-for-performance#recommended-fields-to-index
