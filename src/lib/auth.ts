import { getRequestEvent } from "$app/server";
import {
  BETTER_AUTH_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  POCKETID_BASE_URL,
  POCKETID_CLIENT_ID,
  POCKETID_CLIENT_SECRET,
} from "$env/static/private";
import { passkey } from "@better-auth/passkey";
import type { APIError } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { generateRandomString } from "better-auth/crypto";
import { betterAuth } from "better-auth/minimal";
import {
  admin,
  genericOAuth,
  haveIBeenPwned,
  lastLoginMethod,
  organization,
  twoFactor,
  type GenericOAuthConfig,
} from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { APP } from "./const/app.const";
import { AccessControl } from "./const/auth/access_control.const";
import { AUTH, type IAuth } from "./const/auth/auth.const";
import { TWO_FACTOR } from "./const/auth/two_factor.const";
import { EMAIL } from "./const/email.const";
import { db } from "./server/db/drizzle.db";
import {
  AccountTable,
  InvitationTable,
  MemberTable,
  OrganizationTable,
  PasskeyTable,
  SessionTable,
  TwoFactorTable,
  UserTable,
  VerificationTable,
  type Session,
} from "./server/db/models/auth.model";
import { redis } from "./server/db/redis.db";
import { Repo } from "./server/db/repos/index.repo";
import { EmailService } from "./services/email.service";
import { Log } from "./utils/logger.util";

// SECTION: betterAuth init
export const auth = betterAuth({
  appName: APP.NAME,

  // NOTE: Can't get this working...
  // It seems like the behaviour is different when setting baseURL
  // versus just using the BETTER_AUTH_URL env var
  // baseURL: APP.URL,

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

  experimental: {
    joins: true,
  },

  advanced: {
    database: {
      // NOTE: Let drizzle generate IDs, as BetterAuth's nanoid causes issues
      // We want UUIDs everywhere, so that the image table can reference resource_id in a generic way
      generateId: false,
    },
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    debugLogs: false,

    schema: {
      user: UserTable,
      account: AccountTable,
      session: SessionTable,
      verification: VerificationTable,
      organization: OrganizationTable,
      member: MemberTable,
      invitation: InvitationTable,
      passkey: PasskeyTable,
      twoFactor: TwoFactorTable,
    },
  }),

  session: {
    storeSessionInDatabase: false,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds

      refreshCache: true,
    },

    additionalFields: {
      // NOTE: These are set in the session create hook below
      member_id: {
        type: "string",
        input: false,
        returned: true,
        required: false,
        defaultValue: null,
      },
      member_role: {
        type: "string",
        input: false,
        returned: true,
        required: false,
        defaultValue: null,
      },
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
        before: async (session) => {
          const data = await get_or_create_org_id(session);

          return {
            data: {
              ...session,

              member_id: data?.member_id,
              activeOrganizationId: data?.org_id,
            },
          };
        },
      },
    },
  },

  user: {
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await EmailService.send(
          EMAIL.TEMPLATES["delete-account-verification"]({ url, user }),
        );
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
      await EmailService.send(EMAIL.TEMPLATES["password-reset"]({ url, user }));
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url }) => {
      await EmailService.send(
        EMAIL.TEMPLATES["email-verification"]({ url, user }),
      );
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

    twoFactor({
      totpOptions: {
        digits: TWO_FACTOR.TOTP.DIGITS,
        period: TWO_FACTOR.TOTP.PERIOD_SECONDS,
      },
    }),

    passkey({
      rpName: APP.NAME,
      rpID: new URL(APP.URL).hostname,
    }),

    haveIBeenPwned({
      customPasswordCompromisedMessage:
        "That password has been compromised in a data breach. Please choose a different one.",
    }),

    lastLoginMethod({
      customResolveMethod: (ctx) => {
        // NOTE: The plugin uses different terminology to the rest of the lib...
        if (ctx.path === "/sign-in/email" || ctx.path === "/sign-up/email") {
          return "credential" satisfies IAuth.ProviderId;
        } else {
          // Return null to use default logic
          return null;
        }
      },
    }),

    // TODO: Lots of new builtin org features
    // I probably don't need to be doing so much manually, especially on invites and member roles
    organization({
      allowUserToCreateOrganization: false,
      cancelPendingInvitationsOnReInvite: true,
      requireEmailVerificationOnInvitation: true,

      // schema: {
      //   session: {
      //     fields: {
      //       activeOrganizationId: "org_id",
      //     },
      //   },
      // },

      // Doesn't seem to do anything?
      // SOURCE: https://github.com/better-auth/better-auth/blob/eb691e213dbe44a3c177d10a2dfd2f39ace0bf98/packages/better-auth/src/plugins/organization/types.ts#L340
      // autoCreateOrganizationOnSignUp: true,

      sendInvitationEmail: async (data) => {
        await EmailService.send(EMAIL.TEMPLATES["org-invite"](data));
      },
    }),

    genericOAuth({
      config: [
        POCKETID_CLIENT_ID && POCKETID_CLIENT_SECRET && POCKETID_BASE_URL
          ? ((): GenericOAuthConfig => {
              const providerId = "pocket-id" satisfies IAuth.ProviderId;

              return {
                providerId,
                clientId: POCKETID_CLIENT_ID,
                clientSecret: POCKETID_CLIENT_SECRET,

                discoveryUrl:
                  POCKETID_BASE_URL + "/.well-known/openid-configuration",
                // ... other config options

                mapProfileToUser: (profile: unknown) => {
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

    // NOTE: Must be last, as it needs the request event
    // SOURCE: https://www.better-auth.com/docs/integrations/svelte-kit#server-action-cookies
    sveltekitCookies(getRequestEvent),
  ],

  // SOURCE: https://www.better-auth.com/docs/concepts/database#secondary-storage
  secondaryStorage: redis
    ? {
        get: async (key) => {
          return redis!.get(key);
        },

        set: async (key, value, ttl) => {
          if (ttl) await redis!.set(key, value, { ex: ttl });
          // or for ioredis:
          // if (ttl) await redis!.set(key, value, "EX", ttl);
          else await redis!.set(key, value);
        },

        delete: async (key) => {
          await redis!.del(key);
        },
      }
    : undefined,
});
// !SECTION

// SECTION: Helper functions
const get_or_create_org_id = async (
  session: Pick<Session, "userId">,
): Promise<{
  org_id: string;
  member_id: string;
} | null> => {
  // NOTE: Order is preserved when logging, so show ctx first
  const log = Log.child({
    ctx: "[auth.session.create.before]",
    userId: session.userId,
  });

  const member = await Repo.query(
    db.query.member.findFirst({
      columns: { id: true, organizationId: true },
      where: (member, { eq }) => eq(member.userId, session.userId),
    }),
  );

  if (!member.ok) {
    return null;
  } else if (member.data) {
    log.debug(
      { organizationId: member.data.organizationId },
      "Found existing organization",
    );

    return {
      member_id: member.data.id,
      org_id: member.data.organizationId,
    };
  }

  log.info("Creating new organization");

  const user = await Repo.query(
    db.query.user.findFirst({
      columns: { name: true, email: true },
      where: (user, { eq }) => eq(user.id, session.userId),
    }),
  );

  if (!user.ok || !user.data) {
    log.error("User not found");
    return null;
  }

  log.debug({ user }, "User info");

  const org = await Repo.insert_one(
    db
      .insert(OrganizationTable)
      .values({
        createdAt: new Date(),

        name: `${user.data.name || user.data.email}'s Org`,
        slug: generateRandomString(8, "a-z", "0-9").toLowerCase(),
      })
      .returning(),
  );

  if (!org.ok) {
    return null;
  }

  const new_member = await Repo.insert_one(
    db
      .insert(MemberTable)
      .values({
        role: "owner",
        userId: session.userId,
        organizationId: org.data.id,
      })
      .returning(),
  );

  if (!new_member.ok) {
    return null;
  }

  return {
    org_id: org.data.id,
    member_id: new_member.data.id,
  };
};

type ErrorCode = keyof typeof auth.$ERROR_CODES;

export const is_ba_error_code = (error: APIError, ...codes: ErrorCode[]) =>
  codes.includes(error.body?.code as ErrorCode);
