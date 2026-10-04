import { getRequestEvent } from "$app/server";
import {
  BETTER_AUTH_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  CAPTCHA_SECRET_KEY,
  PAYSTACK_SECRET_KEY,
  POCKETID_CLIENT_ID,
  POCKETID_CLIENT_SECRET,
  POCKETID_BASE_URL,
} from "$app/env/private";
import { PUBLIC_BASE_URL } from "$app/env/public";
import { paystack, type PaystackPlan } from "better-auth-paystack";
import { apiKey } from "@better-auth/api-key";
// `/relations-v2`, not the package root: the adapter reads its relation
// registry from `db._.schema` at the root entrypoint (drizzle 0.x, the old
// `relations()` helper) and from `db._.relations` here (drizzle 1.x
// `defineRelations`). `drizzle.db.ts` passes `relations` and no `schema`, so
// the root entrypoint resolves zero relation keys — joins would silently
// return nothing rather than fail.
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { passkey } from "@better-auth/passkey";
import { captureException } from "@sentry/sveltekit";
import type { APIError } from "better-auth";
import { betterAuth } from "better-auth/minimal";
import type { Branded } from "./interfaces/zod/zod.type.js";
import {
  admin,
  captcha,
  emailOTP,
  genericOAuth,
  haveIBeenPwned,
  lastLoginMethod,
  organization,
  twoFactor,
  type GenericOAuthConfig,
} from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { createAuthMiddleware } from "better-auth/api";
import { APP } from "./const/app.const.js";
import { AccessControl } from "./const/auth/access_control.const.js";
import { AUTH, type IAuth } from "./const/auth/auth.const.js";
import { EMAIL_OTP } from "./const/auth/email_otp.const.js";
import { OrgAccessControl } from "./const/auth/organization_access_control.const.js";
import { TWO_FACTOR } from "./const/auth/two_factor.const.js";
import { db } from "./server/db/drizzle.db.js";
import { type Session } from "./server/db/models/auth.model.js";
import { REDIS_PREFIX, redis } from "./server/db/redis.db.js";
import { Repo } from "./server/db/repos/index.repo.js";
import { schema } from "./server/db/schema.js";
import { PaystackClient } from "./server/sdk/payment/paystack/paystack.payment.sdk.js";
import { AdapterService } from "./server/services/adapter/adapter.service.js";
import { audit_plugin } from "./server/services/audit/audit.plugin.js";
import { AuditService } from "./server/services/audit/audit.service.js";
import { Dicebear } from "./server/services/dicebear/dicebear.service.js";
import { EmailValidationService } from "./server/services/auth/email/email_validation.service.js";
import { ExistingAccountService } from "./server/services/auth/email/existing_account.service.js";
import { InboxQuery } from "./server/services/auth/email/inbox.query.js";
import { MembershipQuery } from "./server/services/auth/membership.query.js";
import { MemberSessionService } from "./server/services/auth/organization/member_session.service.js";
import { SecondFactorHook } from "./server/services/auth/two_factor/second_factor.hook.js";
import { AccountDeletionService } from "./server/services/auth/user/account_deletion.service.js";
import { Mailer } from "./server/email/email.mailer.js";
import { RuntimeService } from "./server/services/runtime/runtime.service.js";
import { Log } from "./utils/logger.util.js";

// SECTION: betterAuth init
export const auth = betterAuth({
  appName: APP.NAME,
  baseURL: PUBLIC_BASE_URL,

  secrets: [
    // NOTE: New data is always encrypted with the latest key (first in the array), while decryption automatically tries all configured keys. This lets you roll secrets gradually without downtime or data loss.
    // {version: 2, value: BETTER_AUTH_SECRET},
    { version: 1, value: BETTER_AUTH_SECRET }, //
  ],

  logger: {
    level: "debug",
    log: (level, message, ...args) => {
      Log[level]({ args }, message);
    },
  },

  telemetry: {
    enabled: false,
  },

  // On in production by default, stored in `secondaryStorage`. Only the rules
  // are ours.
  rateLimit: {
    customRules: AUTH.ROUTER_RATE_LIMIT_RULES,
  },

  // Routes a remote function replaces; see `AUTH.DISABLED_PATHS`.
  disabledPaths: [...AUTH.DISABLED_PATHS],

  advanced: {
    // Better-Auth hands over an already-started promise; the thunk only lets
    // the shutdown drain wait for it.
    backgroundTasks: {
      handler: (task) => {
        RuntimeService.defer(async () => await task);
      },
    },

    // The address SvelteKit resolved, honouring `ADDRESS_HEADER`/`XFF_DEPTH`
    // off Vercel. Never a header a client can set — see `CLIENT_IP_HEADER`.
    ipAddress: {
      ipAddressHeaders: [AdapterService.CLIENT_IP_HEADER],
    },

    database: {
      // NOTE: Let drizzle generate IDs, as BetterAuth's nanoid causes issues
      // We want UUIDs everywhere, so that the image table can reference resource_id in a generic way
      generateId: false,

      // Fetch related rows in one query instead of the N+1 fallback. Better-Auth
      // only joins from core (session/account -> user, user -> accounts) and the
      // organization plugin (member -> user/organization, organization ->
      // members/invitations, invitation -> organization); every one of those
      // relation keys is defined in `relations.ts`.
      joins: true,
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

      // Bump with any change to `additionalFields`, or cookies baked with the
      // old field set stay readable for `maxAge`. A bump logs nobody out — the
      // session itself lives in Redis — it only forces a re-read. "2" dropped
      // `active_plan`.
      version: "2",
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
      country: {
        type: "string",
        input: false,
        returned: true,
        required: false,
        defaultValue: null,
      },
    },
  },

  hooks: {
    // `leaveOrganization` fires no organization hook. @see MemberSessionService.after_endpoint
    after: createAuthMiddleware(async (ctx) =>
      MemberSessionService.after_endpoint({
        path: ctx.path,
        returned: ctx.context.returned,
        store: ctx.context.internalAdapter,
      }),
    ),
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!user.image) {
            const image = Dicebear.get_url({ seed: user.email });
            if (image.ok) {
              user.image = image.data;
            }
          }

          return { data: user };
        },
      },

      // Fires after `deleteUser` has removed the account rows, too late to
      // refuse; `before` runs earlier. @see AccountDeletionService
      delete: {
        before: async (user) => {
          await AccountDeletionService.backstop(user);
        },
        after: async (user) => {
          await AccountDeletionService.after(user);
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          AuditService.on_account_created(account);
        },
      },
      delete: {
        after: async (account, ctx) => {
          AuditService.on_account_deleted(account, {
            path: ctx?.path,
            session: ctx?.context.session ?? null,
          });
        },
      },
    },
    session: {
      create: {
        before: async (session, ctx) => {
          await SecondFactorHook.refuse_code_sign_in(session, ctx);

          const geo = AdapterService.get_geo();

          const data = await get_active_org(session);

          return {
            data: {
              ...session,
              country: geo.country,

              org_id: data?.org_id,
              member_id: data?.member_id,
              member_role: data?.member_role,
              activeOrganizationId: data?.org_id,
            },
          };
        },
      },

      update: {
        // Keep our derived org-scoped fields in sync whenever the active
        // organization changes. BA's `setActiveOrganization` calls
        // `updateSession(token, { activeOrganizationId })`, which fires this
        // hook before re-baking the session cookie via `setSessionCookie`.
        before: async (session, ctx) => {
          if (!("activeOrganizationId" in session)) return;

          const userId = ctx?.context?.session?.user?.id;
          if (!userId) return;

          const raw = session.activeOrganizationId;
          const next_org_id = typeof raw === "string" ? raw : null;

          if (!next_org_id) {
            return {
              data: {
                ...session,
                org_id: null,
                member_id: null,
                member_role: null,
              },
            };
          }

          const data = await derive_org_session({
            userId,
            org_id: next_org_id,
          });

          return {
            data: {
              ...session,
              org_id: data?.org_id ?? null,
              member_id: data?.member_id ?? null,
              member_role: data?.member_role ?? null,
            },
          };
        },
      },
    },
  },

  user: {
    /**
     * Refuses a disposable or mail-less domain on every new identity, whatever
     * the auth method, at the `createUser` / `linkAccount` seam — so Google
     * and Pocket ID sign-ups are covered too, not just the email form. On
     * `/sign-up/email` Better-Auth turns any refusal into a fake
     * duplicate-email success, so `signup_remote`'s own pre-flight check is
     * still what shows the error.
     *
     * Fails open when a lookup itself breaks: a DNS or database outage must
     * not become a sign-up outage. Only a definite answer refuses.
     */
    validateUserInfo: async ({ user, source }) => {
      if (source.action !== "create-user" && source.action !== "link-account") {
        return undefined;
      }

      const email = user.email;
      if (typeof email !== "string") return undefined;

      const refused = await EmailValidationService.refusal(
        email as Branded<"EmailAddress">,
      );
      if (refused.ok && refused.data) {
        return {
          error: "email_address_refused",
          errorDescription: refused.data,
        };
      }

      // A password sign-up for an inbox that already has an account under
      // another spelling (`j.ohn+x@gmail.com` for `john@gmail.com`). The fake
      // success is the answer, and the owner is told which address to use. A
      // provider's sign-up is let through: it verified the inbox, and refusing
      // would lock its owner out of that button.
      if (
        source.action === "create-user" &&
        source.method === "email-password"
      ) {
        const owner = await InboxQuery.owner(
          { email },
          { id: true, name: true, email: true, emailVerified: true },
        );
        if (owner.ok && owner.data) {
          const existing = owner.data;
          RuntimeService.defer(() => ExistingAccountService.notify(existing));

          return {
            error: "email_inbox_taken",
            errorDescription: "An account already uses this inbox",
          };
        }
      }

      // `undefined` is "accepted".
      return undefined;
    },

    /**
     * A verified user confirms from the address they have before the new one
     * is sent its own verification link, so a hijacked session cannot move
     * the account to an inbox the attacker controls. An unverified user's
     * change goes straight to that link.
     */
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        await Mailer.send("change-email-confirmation", {
          url,
          user,
          new_email: newEmail,
        });
      },
    },

    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await Mailer.send("delete-account-verification", { url, user });
      },
      // After the link's token is checked, before anything is deleted. The
      // admin plugin's `removeUser` never calls this: `AdminService.remove`.
      beforeDelete: async (user) => {
        await AccountDeletionService.before(user);
      },
    },
  },

  verification: {
    storeIdentifier: "hashed",
    storeInDatabase: false,
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
    minPasswordLength: AUTH.PASSWORD.MIN_LENGTH,
    maxPasswordLength: AUTH.PASSWORD.MAX_LENGTH,

    sendResetPassword: async ({ user, url }) => {
      await Mailer.send("password-reset", { url, user });
    },

    onPasswordReset: async ({ user }) => {
      AuditService.on_password_reset(user);
    },

    // A sign-up for a taken address is answered as if it had worked; this
    // tells the owner to sign in instead.
    onExistingUserSignUp: async ({ user }) => {
      await ExistingAccountService.notify(user);
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await Mailer.send("email-verification", { url, user });
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

            // `emailAndPassword.requireEmailVerification` does not cover social
            // sign-in. Not the same thing as `force_email_verified`, which has
            // the opposite polarity: it trusts a provider that cannot verify.
            requireEmailVerification: true,
          }
        : undefined,
  },

  plugins: [
    admin({
      ac: AccessControl.ac,
      roles: AccessControl.roles,
    }),

    captcha({
      provider: "cloudflare-turnstile",
      secretKey: CAPTCHA_SECRET_KEY,
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
      cookieName: AUTH.LAST_LOGIN_METHOD_COOKIE,
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
      ac: OrgAccessControl.ac,
      roles: OrgAccessControl.roles,

      allowUserToCreateOrganization: false,
      cancelPendingInvitationsOnReInvite: true,
      requireEmailVerificationOnInvitation: true,

      sendInvitationEmail: async (data) => {
        await Mailer.send("org-invite", data);
      },

      /**
       * The derived session fields do not follow `member`, so a membership
       * change pushes to the stored sessions itself. `read_session` re-reads
       * the membership per request anyway; this keeps what Redis holds from
       * contradicting it. Leaving fires no organization hook — see
       * `hooks.after`.
       * @see MemberSessionService
       */
      organizationHooks: {
        afterRemoveMember: async ({ member }) => {
          await MemberSessionService.revoke(await session_store(), {
            user_id: member.userId,
            org_id: member.organizationId,
          });
        },
        afterUpdateMemberRole: async ({ member }) => {
          await MemberSessionService.set_role(await session_store(), {
            user_id: member.userId,
            org_id: member.organizationId,
            role: member.role,
          });
        },
      },
    }),

    apiKey([
      {
        configId: "default",
        requireName: true,
        defaultPrefix: "sk_",
        references: "organization",

        // SOURCE: https://better-auth.com/docs/plugins/api-key/advanced#secondary-storage-with-fallback
        fallbackToDatabase: true,
        storage: "secondary-storage",
      },
    ]),

    paystack({
      paystackClient: PaystackClient,
      secretKey: PAYSTACK_SECRET_KEY,
      paystackWebhookSecret: PAYSTACK_SECRET_KEY,

      organization: {
        enabled: true,
      },

      subscription: {
        enabled: true,
        requireEmailVerification: true,

        plans: async () => {
          type PlanListResponse = {
            error?: unknown;
            data?: {
              data: {
                name: string;
                amount: number;
                currency: string;
                plan_code: string;
                invoice_limit: number;
                interval: string;
                is_archived?: boolean;
                is_deleted?: boolean;
              }[];
            };
          };
          const plans = (await PaystackClient.plan.list(
            {},
          )) as PlanListResponse;

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
          const member = await MembershipQuery.for_user(
            { org_id: data.referenceId, user_id: data.user.id },
            { role: true },
          );

          if (!member.ok || member.data?.role !== "owner") {
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

                discoveryUrl: `${POCKETID_BASE_URL}/.well-known/openid-configuration`,
                // Declared here rather than at the call site: 1.7 registers this
                // as a social provider, and `signIn.social` takes no `scopes`.
                scopes: ["openid", "profile", "email"],

                mapProfileToUser: (profile: unknown) => {
                  // NOTE: Typing profile directly in the callback arg gives a TS error, since better-auth expects Record<string, any>
                  const typed = profile as IAuth.GenericOAuthProfile;

                  const name = (
                    typed.name ||
                    `${typed.given_name || ""} ${typed.family_name || ""}`
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

    /**
     * Sign-in by emailed code, for existing accounts only: a new one still
     * comes through sign-up, which asks for a name and a captcha. Its routes
     * are closed to direct HTTP — see `AUTH.DISABLED_PATHS`.
     */
    emailOTP({
      otpLength: EMAIL_OTP.LENGTH,
      expiresIn: EMAIL_OTP.EXPIRES_IN_SECONDS,
      allowedAttempts: EMAIL_OTP.ALLOWED_ATTEMPTS,
      // Defaults to "plain": a Redis read would otherwise be a working code.
      storeOTP: "hashed",
      disableSignUp: true,

      sendVerificationOTP: async ({ email, otp, type }) => {
        // `/email-otp/send-verification-otp` accepts other types, though
        // nothing here can redeem them; send nothing for them either.
        if (type !== "sign-in") {
          Log.warn({ type }, "auth.email_otp.unexpected_type");
          return;
        }

        await Mailer.send("signin-code", {
          email,
          code: otp,
          expires_in_minutes: EMAIL_OTP.EXPIRES_IN_SECONDS / 60,
        });
      },
    }),

    // After `twoFactor`: see `audit_plugin`.
    audit_plugin(AuditService.after_endpoint),

    // NOTE: Must be last, as it needs the request event
    // SOURCE: https://www.better-auth.com/docs/integrations/svelte-kit#server-action-cookies
    sveltekitCookies(getRequestEvent),
  ],

  // SOURCE: https://www.better-auth.com/docs/concepts/database#secondary-storage
  secondaryStorage: {
    get: async (key) => {
      return redis.get(ba_key(key));
    },

    set: async (key, value, ttl) => {
      if (ttl) await redis.set(ba_key(key), value, { ex: ttl });
      else await redis.set(ba_key(key), value);
    },

    delete: async (key) => {
      await redis.del(ba_key(key));
    },

    /**
     * Read-and-delete in one round trip, required since 1.7 — Better-Auth no
     * longer falls back to `get` then `delete`. Both halves have to land
     * together for anything single-use (verification values, one-time tokens):
     * two concurrent requests that each read before either deletes would both
     * see a live credential and both redeem it.
     */
    getAndDelete: async (key) => {
      return redis.getdel(ba_key(key));
    },

    /**
     * Counter bump, also atomic by contract, and the reason the api-key
     * plugin's `storage: "secondary-storage"` is allowed to keep its rate-limit
     * and refill state out of Postgres.
     *
     * `ttl` applies **only when the key is created**, so the window is fixed
     * from the first request in it rather than sliding forward on every later
     * one. `INCR` followed by `EXPIRE` would be two round trips with a gap in
     * which a crash leaves a counter that never expires, hence the one Lua
     * call. See {@link INCREMENT_SCRIPT}.
     */
    increment: async (key, ttl) => {
      return redis.eval<[number], number>(
        INCREMENT_SCRIPT,
        [ba_key(key)],
        [ttl ?? 0],
      );
    },
  },
});
// !SECTION

// SECTION: Helper functions
/**
 * Every Better-Auth secondary-storage key is namespaced through this — see
 * {@link REDIS_PREFIX} for why a bare key is never correct.
 */
const ba_key = (key: string) => `${REDIS_PREFIX}:${key}`;

/** For the organization hooks, which are handed no context to reach it through. */
const session_store = async () => (await auth.$context).internalAdapter;

/**
 * `INCR`, plus `EXPIRE` on creation only, as one atomic operation.
 *
 * `count == 1` is the "key did not exist" signal: `INCR` seeds a missing key at
 * 1, so the expiry is stamped exactly once per window and never extended by the
 * requests that follow.
 *
 * The `> 0` guard matters: a missing `ttl` arrives as 0, and `EXPIRE key 0`
 * deletes the key, which would pin the counter at 1 forever.
 */
const INCREMENT_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 and tonumber(ARGV[1]) > 0 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return count
`;

// NOTE: Renamed from get_or_create_org_id - no longer creates orgs automatically
// Organizations are now created via the onboarding flow after email verification
const get_active_org = async (
  session: Pick<Session, "userId">,
): Promise<{
  org_id: string;
  member_id: string;
  member_role: string;
} | null> => {
  const log = Log.child({
    ctx: "[auth.session.create.before]",
    userId: session.userId,
  });

  try {
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

    return {
      member_id: member.data.id,
      member_role: member.data.role,
      org_id: member.data.organizationId,
    };
  } catch (error) {
    log.error(error, "error unknown");
    captureException(error);
    return null;
  }
};

// Resolve the derived session fields for a known (user, org) pair. Used by
// the session.update hook when the user switches active organization.
const derive_org_session = async ({
  userId,
  org_id,
}: {
  userId: string;
  org_id: string;
}): Promise<{
  org_id: string;
  member_id: string;
  member_role: string;
} | null> => {
  const log = Log.child({
    ctx: "[auth.session.update.before]",
    userId,
    org_id,
  });

  try {
    const member = await MembershipQuery.for_user(
      { org_id, user_id: userId },
      { id: true, role: true },
    );

    if (!member.ok || !member.data) {
      log.warn("Membership not found for active org switch");
      return null;
    }

    return {
      member_id: member.data.id,
      member_role: member.data.role,
      org_id,
    };
  } catch (error) {
    log.error(error, "error unknown");
    captureException(error);
    return null;
  }
};

type ErrorCode = keyof typeof auth.$ERROR_CODES;

export const is_ba_error_code = (error: APIError, ...codes: ErrorCode[]) =>
  codes.some((code) => code === error.body?.code);
