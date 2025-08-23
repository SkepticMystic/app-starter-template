import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "$env/static/private";
import {
  betterAuth,
  type GenericEndpointContext,
  type Session,
} from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { generateRandomString } from "better-auth/crypto";
import {
  admin,
  haveIBeenPwned,
  organization,
  type MemberInput,
  type OrganizationInput,
} from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import mongoose from "mongoose";
import { AccessControl } from "./auth/permissions";
import { APP } from "./const/app";
import { EMAIL } from "./const/email";
import { Members } from "./models/auth/Member.model";
import { Email } from "./utils/email";

const get_or_create_org_id = async (
  session: Session,
  ctx: GenericEndpointContext,
) => {
  const member = await Members.findOne(
    { userId: session.userId },
    { organizationId: 1 },
  ).lean();

  if (member) {
    return member.organizationId;
  }

  // SOURCE: https://github.com/better-auth/better-auth/blob/744e9e34c1eb8b75c373f00a71c85e5a599abae6/packages/better-auth/src/plugins/organization/adapter.ts#L186
  const org = await ctx.context.adapter.create<OrganizationInput>({
    model: "organization",
    data: {
      name: "My Organization",
      slug: generateRandomString(8).toLowerCase(),

      createdAt: new Date(),
    },
  });

  if (!org.id) {
    console.error("Failed to create organization");
    return { data: session };
  }

  await ctx.context.adapter.create<MemberInput>({
    model: "member",
    data: {
      role: "owner",
      organizationId: org.id,
      userId: session.userId,

      createdAt: new Date(),
    },
  });

  return org.id;
};

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

  databaseHooks: {
    session: {
      create: {
        before: async (session, ctx) => {
          if (!ctx) {
            return { data: session };
          }

          const organizationId = await get_or_create_org_id(session, ctx);

          return {
            data: {
              ...session,
              activeOrganizationId: organizationId ?? null,
            },
          };
        },
      },
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
    admin({
      ac: AccessControl.ac,
      roles: AccessControl.roles,
    }),

    passkey({
      rpName: APP.NAME,
      rpID: new URL(APP.URL).hostname,
    }),

    haveIBeenPwned({
      customPasswordCompromisedMessage:
        "Your password has been compromised in a data breach. Please choose a different password.",
    }),

    organization({
      allowUserToCreateOrganization: false,

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
