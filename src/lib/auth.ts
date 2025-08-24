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
  type Member,
  type MemberInput,
  type OrganizationInput,
} from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import mongoose from "mongoose";
import { AccessControl } from "./auth/permissions";
import { APP } from "./const/app";
import { EMAIL } from "./const/email";
import { redis } from "./db/redis.db";
import { Email } from "./utils/email";
import { Log } from "./utils/logger.util";

const get_or_create_org_id = async (
  session: Session,
  ctx: GenericEndpointContext,
): Promise<string | null> => {
  const log = Log.child({
    userId: session.userId,
    ctx: "[auth.session.create.before]",
  });

  const member = await ctx.context.adapter.findOne<
    Pick<Member, "organizationId">
  >({
    model: "member",
    select: ["organizationId"],
    where: [{ field: "userId", operator: "eq", value: session.userId }],
  });

  if (member) {
    log.debug(
      { organizationId: member.organizationId },
      "Found existing organization",
    );
    return member.organizationId;
  }

  log.info("Creating new organization");

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
    log.error("Failed to create organization");

    return null;
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
    storeSessionInDatabase: false,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },

  rateLimit: {
    // NOTE: defaults to true in production, false in development
    // enabled: true,
    // NOTE: defaults to secondary if one is configured
    // So no need for us to check for redis
    // storage: redis ? "secondary-storage" : "memory",
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session, ctx) => {
          if (!ctx) {
            Log.error("[auth.session.create.before] No context");
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
        "That password has been compromised in a data breach. Please choose a different one.",
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

  // SOURCE: https://www.better-auth.com/docs/concepts/database#secondary-storage
  secondaryStorage: redis
    ? {
        get: async (key) => {
          Log.debug({ key }, "[redis.get]");

          return redis!.get(key);
        },

        set: async (key, value, ttl) => {
          Log.debug({ key, ttl }, "[redis.set]");

          // if (ttl) await redis!.set(key, value, { EX: ttl });
          // or for ioredis:
          if (ttl) await redis!.set(key, value, "EX", ttl);
          else await redis!.set(key, value);
        },

        delete: async (key) => {
          Log.debug({ key }, "[redis.del]");

          await redis!.del(key);
        },
      }
    : undefined,
});

//  TODO:
//  - Database indexes: https://www.better-auth.com/docs/guides/optimizing-for-performance#recommended-fields-to-index
