import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin, organization } from "better-auth/plugins";
import mongoose from "mongoose";
import { ROUTES } from "./const/routes.const";
import { App } from "./utils/app";
import { Email } from "./utils/email";

export const auth = betterAuth({
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

  plugins: [
    admin(),
    organization({
      allowUserToCreateOrganization: false,

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
