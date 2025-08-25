import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "$env/static/private";
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
  haveIBeenPwned,
  organization,
  type Member,
  type MemberInput,
  type Organization,
  type OrganizationInput,
} from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import mongoose from "mongoose";
import { AccessControl } from "./auth/permissions";
import { APP } from "./const/app";
import { EMAIL } from "./const/email";
import { redis } from "./db/redis.db";
import { Invitations } from "./models/auth/Invitation.model";
import { Members } from "./models/auth/Member.model";
import { Organizations } from "./models/auth/Organization.model";
import { Email } from "./utils/email";
import { Log } from "./utils/logger.util";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";

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

      // Cases:
      // - Just a member of some other org: delete member
      // - Owner of an org with other members: transfer ownership
      // - Owner of an org with no other members: delete member and org

      beforeDelete: async (user) => {
        const any_owner_member = await Members.findOne({
          role: "owner",
          userId: user.id,
        }).lean();

        if (!any_owner_member) {
          Log.info(
            { userId: user.id },
            "User is not an owner of any organization",
          );

          return; // Not an owner of any org, let them delete
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
          throw new APIError("BAD_REQUEST", {
            message:
              "You must transfer ownership of your organization to another member before deleting your account.",
          });
        }

        Log.debug(
          { userId: user.id },
          "User is an owner of an organization with other owners or no other members",
        );
      },

      afterDelete: async (user) => {
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
      },
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
