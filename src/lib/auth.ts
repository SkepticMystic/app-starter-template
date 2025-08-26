import { getRequestEvent } from "$app/server";
import {
  BETTER_AUTH_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  POCKETID_BASE_URL,
  POCKETID_CLIENT_ID,
  POCKETID_CLIENT_SECRET,
} from "$env/static/private";
import {
  betterAuth,
  type GenericEndpointContext,
  type Session,
  type User,
} from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError } from "better-auth/api";
import { generateRandomString } from "better-auth/crypto";
import {
  admin,
  genericOAuth,
  haveIBeenPwned,
  organization,
  type Member,
  type MemberInput,
  type Organization,
  type OrganizationInput,
} from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { sveltekitCookies } from "better-auth/svelte-kit";
import mongoose from "mongoose";
import { AccessControl } from "./auth/permissions";
import { APP } from "./const/app";
import { AUTH, type IAuth } from "./const/auth.const";
import { EMAIL } from "./const/email";
import { redis } from "./db/redis.db";
import type { Result } from "./interfaces";
import { Invitations } from "./models/auth/Invitation.model";
import { Members } from "./models/auth/Member.model";
import { Organizations } from "./models/auth/Organization.model";
import { Email } from "./utils/email";
import { Log } from "./utils/logger.util";
import { err, suc } from "./utils/result.util";

// SECTION: betterAuth init
export const auth = betterAuth({
  appName: APP.NAME,

  baseURL: APP.URL,
  basePath: "/api/auth",

  // .env is not explicitly loaded in prod, so we import it
  // Rather than running dotenv, or something
  secret: BETTER_AUTH_SECRET,

  logger: {
    level: "debug",
    log: (level, message, ...args) => {
      Log[level]({ args }, message);
    },
  },

  telemetry: {
    enabled: false,
  },

  database: mongodbAdapter(
    // NOTE: Actually passing .db doesn't work, seems to be a type bug
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
            Log.error(
              { ctx: "[auth.session.create.before]" },
              "No ctx in hook callback",
            );
            return { data: session };
          }

          const activeOrganizationId = await get_or_create_org_id(session, ctx);

          return {
            data: {
              ...session,
              activeOrganizationId,
            },
          };
        },
      },
    },
  },

  user: {
    deleteUser: {
      enabled: true,

      beforeDelete: async (user) => {
        const orgs_blocking_delete =
          await check_orgs_blocking_user_delete(user);

        if (!orgs_blocking_delete.ok) {
          throw new APIError(orgs_blocking_delete.error.status, {
            message: orgs_blocking_delete.error.message,
          });
        }

        // NOTE: Don't return anything, just proceed with deletion
      },

      afterDelete: async (user) => {
        await cleanup_orgs_after_user_delete(user);
      },
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      updateUserInfoOnLink: true,
      // SOURCE: https://www.better-auth.com/docs/concepts/users-accounts#forced-linking
      // NOTE: Links profile even if email isn't verified on provider side
      trustedProviders: AUTH.PROVIDERS.IDS.filter(
        (id) => AUTH.PROVIDERS.MAP[id].force_email_verified,
      ),
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,

    sendResetPassword: async ({ user, url }) => {
      await Email.send(EMAIL.TEMPLATES["password-reset"]({ url, user }));
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url }) => {
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
    sveltekitCookies(getRequestEvent),

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
      cancelPendingInvitationsOnReInvite: true,
      requireEmailVerificationOnInvitation: true,

      // Doesn't seem to do anything?
      // SOURCE: https://github.com/better-auth/better-auth/blob/eb691e213dbe44a3c177d10a2dfd2f39ace0bf98/packages/better-auth/src/plugins/organization/types.ts#L340
      // autoCreateOrganizationOnSignUp: true,

      sendInvitationEmail: async (data) => {
        await Email.send(EMAIL.TEMPLATES["org-invite"](data));
      },
    }),

    genericOAuth({
      config: [
        POCKETID_CLIENT_ID && POCKETID_CLIENT_SECRET && POCKETID_BASE_URL
          ? (() => {
              const providerId = "pocket-id" satisfies IAuth.ProviderId;

              return {
                providerId,
                clientId: POCKETID_CLIENT_ID,
                clientSecret: POCKETID_CLIENT_SECRET,
                discoveryUrl:
                  POCKETID_BASE_URL + "/.well-known/openid-configuration",
                // ... other config options

                mapProfileToUser: (profile: any) => {
                  Log.info(profile, providerId + " profile");

                  // NOTE: Typing profile directly in the callback arg gives a TS error, since better-auth expects Record<string, any>
                  const typed = profile as IAuth.GenericOAuthProfile;

                  const name = (
                    typed.name ||
                    (typed.given_name || "") +
                      " " +
                      (typed.family_name || "") ||
                    ""
                  )
                    .trim()
                    .replaceAll(/\s+/g, " ");

                  return {
                    name,
                    email: typed.email,
                    image: typed.picture,
                    emailVerified:
                      AUTH.PROVIDERS.MAP[providerId].force_email_verified ||
                      typed.email_verified,
                  };
                },
              };
            })()
          : null,
      ].flatMap((cfg) => (cfg ? [cfg] : [])),
    }),
  ],

  // SOURCE: https://www.better-auth.com/docs/concepts/database#secondary-storage
  secondaryStorage: redis
    ? {
        get: async (key) => {
          return redis!.get(key);
        },

        set: async (key, value, ttl) => {
          // if (ttl) await redis!.set(key, value, { EX: ttl });
          // or for ioredis:
          if (ttl) await redis!.set(key, value, "EX", ttl);
          else await redis!.set(key, value);
        },

        delete: async (key) => {
          await redis!.del(key);
        },
      }
    : undefined,
});

// !SECTION

//  TODO:
//  - Database indexes: https://www.better-auth.com/docs/guides/optimizing-for-performance#recommended-fields-to-index

// ===

// SECTION: Helper functions
const get_or_create_org_id = async (
  session: Session,
  ctx: GenericEndpointContext,
): Promise<string | null> => {
  // NOTE: Order is preserved when logging, so show ctx first
  const log = Log.child({
    ctx: "[auth.session.create.before]",
    userId: session.userId,
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

  const user = await ctx.context.adapter.findOne<Pick<User, "name" | "email">>({
    model: "user",
    select: ["name", "email"],
    where: [{ field: "id", operator: "eq", value: session.userId }],
  });

  if (!user) {
    log.error("User not found");
    return null;
  }

  log.debug({ user }, "User info");

  // SOURCE: https://github.com/better-auth/better-auth/blob/744e9e34c1eb8b75c373f00a71c85e5a599abae6/packages/better-auth/src/plugins/organization/adapter.ts#L186
  const org = await ctx.context.adapter.create<
    OrganizationInput,
    Pick<Organization, "id">
  >({
    model: "organization",
    select: ["id"],
    data: {
      // NOTE: || because name is always defined, but may be empty
      name: `${user.name || user.email}'s Org`,
      slug: generateRandomString(8, "a-z", "0-9").toLowerCase(),

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

// Cases:
// - Just a member of some other org: delete member
// - Owner of an org with other members: transfer ownership
// - Owner of an org with no other members: delete member and org

const check_orgs_blocking_user_delete = async (
  user: User,
): Promise<
  Result<undefined, { message: string; status: APIError["status"] }>
> => {
  const any_owner_member = await Members.findOne({
    role: "owner",
    userId: user.id,
  }).lean();

  if (!any_owner_member) {
    Log.info({ userId: user.id }, "User is not an owner of any organization");

    // Not an owner of any org, let them delete
    return suc();
  }

  const other_org_members = await Members.find({
    userId: { $ne: user.id },
    organizationId: any_owner_member.organizationId,
  }).lean();

  if (
    // Is owner of an org with other members,
    other_org_members.length > 0 &&
    // but none are owners
    other_org_members.every((m) => m.role !== "owner")
  ) {
    return err({
      status: "BAD_REQUEST",
      message:
        "You must transfer ownership of your organization to another member before deleting your account.",
    });
  }

  Log.debug(
    { userId: user.id },
    "User is an owner of an organization with other owners or no other members",
  );

  return suc();
};

const cleanup_orgs_after_user_delete = async (user: User) => {
  const user_members = await Members.find(
    { userId: user.id },
    { organizationId: 1 },
  ).lean();

  const org_ids = user_members.map((m) => m.organizationId);

  await Promise.allSettled([
    Email.send(EMAIL.TEMPLATES["user-deleted"]({ user })),

    Members.deleteMany({ userId: user.id }).lean(),

    Invitations.deleteMany({
      status: "pending",
      inviterId: user.id,
    }).lean(),

    // Delete orgs with no other members
    ...org_ids.map(async (org_id) => {
      const other_org_member = await Members.findOne({
        userId: { $ne: user.id },
        organizationId: org_id,
      }).lean();

      if (!other_org_member) {
        Log.info(
          { org_id, userId: user.id },
          "Deleting organization with no other members",
        );

        return Organizations.deleteOne({ _id: org_id }).lean();
      }

      Log.debug(
        { org_id, userId: user.id },
        "Not deleting organization with other members",
      );
    }),
  ]);
};

// !SECTION
