import { getRequestEvent } from "$app/server";
import {
  BETTER_AUTH_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  PAYSTACK_SECRET_KEY,
  POCKETID_BASE_URL,
  POCKETID_CLIENT_ID,
  POCKETID_CLIENT_SECRET,
} from "$env/static/private";
import { PUBLIC_BASE_URL } from "$env/static/public";
import { paystack, type PaystackPlan } from "@alexasomba/better-auth-paystack";
import { passkey } from "@better-auth/passkey";
import { waitUntil } from "@vercel/functions";
import type { APIError } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
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
import { type Session } from "./server/db/models/auth.model";
import { redis } from "./server/db/redis.db";
import { Repo } from "./server/db/repos/index.repo";
import { schema } from "./server/db/schema";
import { PaystackClient } from "./server/sdk/payment/paystack/paystack.payment.sdk";
import { EmailService } from "./server/services/email.service";
import { SubscriptionService } from "./server/services/subscription/subscription.service";
import { Log } from "./utils/logger.util";

// SECTION: betterAuth init
export const auth = betterAuth({
  appName: APP.NAME,
  baseURL: PUBLIC_BASE_URL,
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
    // TODO: Enable once BA support dirzzle 1.0
    joins: false,
  },

  advanced: {
    backgroundTasks: { handler: waitUntil },

    database: {
      // NOTE: Let drizzle generate IDs, as BetterAuth's nanoid causes issues
      // We want UUIDs everywhere, so that the image table can reference resource_id in a generic way
      generateId: false,
    },
  },

  database: drizzleAdapter(db, {
    schema,
    provider: "pg",
    debugLogs: false,
  }),

  session: {
    storeSessionInDatabase: false,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },

    additionalFields: {
      // NOTE: These are set in the session create hook below
      org_id: {
        type: "string",
        input: false,
        returned: true,
        required: false,
        defaultValue: null,
      },
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
      active_plan: {
        type: "string",
        input: false,
        returned: true,
        required: false,
        defaultValue: null,
      },
    },
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const data = await get_active_org(session);

          return {
            data: {
              ...session,
              org_id: data?.org_id,
              member_id: data?.member_id,
              member_role: data?.member_role,
              active_plan: data?.active_plan,
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

    organization({
      allowUserToCreateOrganization: false,
      cancelPendingInvitationsOnReInvite: true,
      requireEmailVerificationOnInvitation: true,

      sendInvitationEmail: async (data) => {
        await EmailService.send(EMAIL.TEMPLATES["org-invite"](data));
      },
    }),

    paystack({
      paystackClient: PaystackClient,
      paystackWebhookSecret: PAYSTACK_SECRET_KEY,

      organization: {
        enabled: true,
        createCustomerOnOrganizationCreate: true,
      },

      subscription: {
        enabled: true,
        requireEmailVerification: true,

        plans: async () => {
          const plans = await PaystackClient.plan_list({});

          if (plans.error) {
            Log.error(plans.error, "auth.paystack.subscription.plans.error");

            return [];
          } else if (plans.data) {
            return plans.data.data
              .filter((p) => !p.is_archived && !p.is_deleted)
              .map((p) => ({
                name: p.name,
                amount: p.amount,
                currency: p.currency,
                planCode: p.plan_code,
                invoiceLimit: p.invoice_limit,
                interval: p.interval as PaystackPlan["interval"],
              }));
          } else {
            Log.error("auth.paystack.subscription.plans no data");
            return [];
          }
        },

        async authorizeReference(data) {
          const member = await Repo.query(
            db.query.member.findFirst({
              columns: { role: true },
              where: { userId: data.user.id, organizationId: data.referenceId },
            }),
          );

          if (!member.ok || !member.data || member.data.role !== "owner") {
            return false;
          }

          return true;
        },
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
          return redis.get(APP.ID + ":" + key);
        },

        set: async (key, value, ttl) => {
          if (ttl) await redis.set(APP.ID + ":" + key, value, { ex: ttl });
          // or for ioredis:
          // if (ttl) await redis.set(key, value, "EX", ttl);
          else await redis.set(APP.ID + ":" + key, value);
        },

        delete: async (key) => {
          await redis.del(APP.ID + ":" + key);
        },
      }
    : undefined,
});
// !SECTION

// SECTION: Helper functions
// NOTE: Renamed from get_or_create_org_id - no longer creates orgs automatically
// Organizations are now created via the onboarding flow after email verification
const get_active_org = async (
  session: Pick<Session, "userId">,
): Promise<{
  org_id: string;
  member_id: string;
  member_role: string;
  active_plan: string;
} | null> => {
  const log = Log.child({
    ctx: "[auth.session.create.before]",
    userId: session.userId,
  });

  const member = await Repo.query(
    db.query.member.findFirst({
      columns: { id: true, organizationId: true, role: true },
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    }),
  );

  if (!member.ok || !member.data) {
    log.debug("No organization found for user");
    return null;
  }

  log.debug(
    { organizationId: member.data.organizationId },
    "Found existing organization",
  );

  const subscription = await SubscriptionService.get_active({
    session: { org_id: member.data.organizationId },
  });
  const active_plan = subscription.ok
    ? (subscription.data?.plan ?? "free")
    : "free";

  return {
    active_plan,
    member_id: member.data.id,
    member_role: member.data.role,
    org_id: member.data.organizationId,
  };
};

type ErrorCode = keyof typeof auth.$ERROR_CODES;

export const is_ba_error_code = (error: APIError, ...codes: ErrorCode[]) =>
  codes.includes(error.body?.code as ErrorCode);
