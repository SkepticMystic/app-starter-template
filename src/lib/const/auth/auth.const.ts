const PROVIDER_IDS = [
  // NOTE: Passkeys aren't providers rn, as they are tied to an existing account
  // "passkey",
  "credential",
  "google",
  "pocket-id",
] as const;

const PROVIDER_MAP: Record<
  IAuth.ProviderId,
  {
    name: string;
    icon: string;

    is_oidc: boolean;
    force_email_verified: boolean;
  }
> = {
  credential: {
    name: "Email",
    icon: "lucide/mail",

    is_oidc: false,
    force_email_verified: false,
  },
  google: {
    name: "Google",
    icon: "devicon-plain/google",

    is_oidc: true,
    force_email_verified: false,
  },
  "pocket-id": {
    name: "Pocket ID",
    icon: "lucide/pocket",

    is_oidc: true,
    // NOTE: Pocket ID hasn't implemented email verification yet
    force_email_verified: true,
  },
};

/**
 * Read by `auth.ts` and `password.schema.ts`, so a form refuses exactly what
 * Better-Auth would — including `PASSWORD_TOO_LONG`, which it checks before
 * comparing on sign-in.
 */
const PASSWORD = {
  MIN_SCORE: 2 as const,
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
};

/**
 * Better-Auth's router limiter (`rateLimit.customRules`), per IP and path.
 * Its built-in rules are sized for one person — 3 per 10s on `/sign-in/*` —
 * so everyone behind one shared IP (an office NAT, a campus, carrier-grade NAT
 * on mobile) refuses everyone else. Loosened where the route is cheap to
 * abuse: `/sign-in/social` only starts an OAuth redirect, and the provider
 * checks the credential.
 */
const ROUTER_RATE_LIMIT_RULES = {
  "/sign-in/social": { window: 10, max: 30 },
} satisfies Record<string, { window: number; max: number }>;

/**
 * Better-Auth routes closed to direct HTTP (`disabledPaths`): every one the
 * app reaches through a remote function calling `auth.api`, so the remote —
 * with its guard and its own limiters, which `auth.api` calls never get from
 * the router — is the only way in. Only the router checks this list, by exact
 * path, so `auth.api` still reaches all of them.
 *
 * Left open on purpose: the browser ceremonies `auth-client.ts` runs (passkey
 * options and verification, `/sign-in/social`), `/callback/*`, the emailed
 * links (`/verify-email`, `/reset-password/:token`, `/delete-user/callback`),
 * `/paystack/webhook`, and `/get-session`.
 */
const DISABLED_PATHS = [
  // `auth.remote.ts`. Email OTP is sign-in only: verification, reset and email
  // change by code are unused.
  "/sign-in/email",
  "/sign-up/email",
  "/email-otp/send-verification-otp",
  "/sign-in/email-otp",
  "/email-otp/check-verification-otp",
  "/email-otp/verify-email",
  "/email-otp/request-password-reset",
  "/forget-password/email-otp",
  "/email-otp/reset-password",
  "/email-otp/request-email-change",
  "/email-otp/change-email",

  // `user.remote.ts`
  "/update-user",
  "/change-password",
  "/change-email",
  "/request-password-reset",
  "/reset-password",
  "/send-verification-email",
  "/delete-user",

  // `session.remote.ts`
  "/list-sessions",
  "/revoke-session",
  "/revoke-other-sessions",
  "/sign-out",

  // `account.remote.ts`
  "/list-accounts",
  "/unlink-account",

  // `two_factor.remote.ts`
  "/two-factor/enable",
  "/two-factor/disable",
  "/two-factor/verify-totp",
  "/two-factor/verify-backup-code",

  // `passkey.remote.ts`
  "/passkey/update-passkey",
  "/passkey/delete-passkey",

  // `apikey.remote.ts`
  "/api-key/create",
  "/api-key/delete",

  // `admin.remote.ts`
  "/admin/set-role",
  "/admin/impersonate-user",
  "/admin/stop-impersonating",
  "/admin/ban-user",
  "/admin/unban-user",
  "/admin/remove-user",

  // `organization.remote.ts`, `member.remote.ts`, `invitation.remote.ts`
  "/organization/create",
  "/organization/delete",
  "/organization/set-active",
  "/organization/leave",
  "/organization/list",
  "/organization/update-member-role",
  "/organization/remove-member",
  "/organization/invite-member",
  "/organization/cancel-invitation",
  "/organization/accept-invitation",

  // `subscription.remote.ts`
  "/paystack/upgrade-subscription",
  "/paystack/enable-subscription",
  "/paystack/disable-subscription",
] as const;

/**
 * `lastLoginMethod`'s cookie, passed to the plugin as `cookieName` and read by
 * the sign-in page's server load. Not httpOnly, so the browser can write it.
 */
const LAST_LOGIN_METHOD_COOKIE = "better-auth.last_used_login_method";

/**
 * How a session was started, by the id `lastLoginMethod` and the security log
 * use. Wider than {@link PROVIDER_IDS}: a passkey or an emailed code signs in
 * without being an `account` row, and `provider_id` is a database enum.
 */
const SIGN_IN_METHOD_LABELS: Record<IAuth.SignInMethod, string> = {
  credential: "Password",
  google: PROVIDER_MAP.google.name,
  "pocket-id": PROVIDER_MAP["pocket-id"].name,
  passkey: "Passkey",
  "email-otp": "Email code",
  "email-verification": "Email verification link",
};

const is_sign_in_method = (method: string): method is IAuth.SignInMethod =>
  Object.hasOwn(SIGN_IN_METHOD_LABELS, method);

/** {@link SIGN_IN_METHOD_LABELS}, falling back to the raw id for one added later. */
const sign_in_method_label = (method: string): string =>
  is_sign_in_method(method) ? SIGN_IN_METHOD_LABELS[method] : method;

export const AUTH = {
  PROVIDERS: {
    IDS: PROVIDER_IDS,
    MAP: PROVIDER_MAP,
  },

  is_sign_in_method,
  sign_in_method_label,

  PASSWORD,
  ROUTER_RATE_LIMIT_RULES,
  DISABLED_PATHS,
  LAST_LOGIN_METHOD_COOKIE,
};

export declare namespace IAuth {
  export type ProviderId = (typeof PROVIDER_IDS)[number];

  /** What `lastLoginMethod` resolves a sign-in to: a provider, or a way in that has no account row. */
  export type SignInMethod =
    | ProviderId
    | "passkey"
    | "email-otp"
    | "email-verification";

  export type GenericOAuthProfile = {
    /** ["00000000-0000-4000-8000-000000000000"] */
    aud: string[];
    /**  "jane@example.com" */
    email: string;
    /**  false */
    email_verified: boolean;
    /**  "2025-08-26T08:31:11.896042775Z" */
    exp: string;
    /**  "Doe" */
    family_name: string;
    /**  "Jane" */
    given_name: string;
    /**  "2025-08-26T07:31:11.896042775Z" */
    iat: string;
    /**  "https://id.example.com" */
    iss: string;
    /**  "Jane Doe" */
    name: string;
    /**  "https://id.example.com/api/users/11111111-1111-4111-8111-111111111111/profile-picture.png" */
    picture: string;
    /**  "jane" */
    preferred_username: string;
    /**  "11111111-1111-4111-8111-111111111111" */
    sub: string;
    /**  "id-token" */
    type: string;
  };
}
