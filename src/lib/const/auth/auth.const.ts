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
    is_social: boolean;
    force_email_verified: boolean;
  }
> = {
  credential: {
    name: "Email",
    icon: "lucide/mail",

    is_oidc: false,
    is_social: false,
    force_email_verified: false,
  },
  google: {
    name: "Google",
    icon: "devicon-plain/google",

    is_oidc: true,
    is_social: true,
    force_email_verified: false,
  },
  "pocket-id": {
    name: "Pocket ID",
    icon: "lucide/pocket",

    is_oidc: true,
    is_social: false,
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
 * Its built-in rules are sized for one person — 3 per 10s on `/sign-in/*`, 3
 * per 60s on `/send-verification-email` — so everyone behind one shared IP (an
 * office NAT, a campus, carrier-grade NAT on mobile) refuses everyone else.
 * Loosened only where the route is cheap to abuse:
 *
 * - `/sign-in/social` only starts an OAuth redirect; the provider checks the
 *   credential. Deliberately not `/sign-in/*`: `/sign-in/email` keeps its
 *   built-in limit, the only per-IP check a direct POST to it meets.
 * - `/send-verification-email` sends nothing for an unknown or verified
 *   address.
 */
const ROUTER_RATE_LIMIT_RULES = {
  "/sign-in/social": { window: 10, max: 30 },
  "/send-verification-email": { window: 60, max: 10 },
} satisfies Record<string, { window: number; max: number }>;

export const AUTH = {
  PROVIDERS: {
    IDS: PROVIDER_IDS,
    MAP: PROVIDER_MAP,
  },

  PASSWORD,
  ROUTER_RATE_LIMIT_RULES,
};

export declare namespace IAuth {
  export type ProviderId = (typeof PROVIDER_IDS)[number];

  export type GenericOAuthProfile = {
    /** ["8e988433-165d-4b69-ac0d-15e2a5f0a3e1"] */
    aud: string[];
    /**  "rossk29@gmail.com" */
    email: string;
    /**  false */
    email_verified: boolean;
    /**  "2025-08-26T08:31:11.896042775Z" */
    exp: string;
    /**  "Keenan" */
    family_name: string;
    /**  "Ross" */
    given_name: string;
    /**  "2025-08-26T07:31:11.896042775Z" */
    iat: string;
    /**  "https://id.keencloud.co.za" */
    iss: string;
    /**  "Ross Keenan" */
    name: string;
    /**  "https://id.keencloud.co.za/api/users/90ec9e5a-5bb6-44c6-b95e-a8c2c54932b5/profile-picture.png" */
    picture: string;
    /**  "ross" */
    preferred_username: string;
    /**  "90ec9e5a-5bb6-44c6-b95e-a8c2c54932b5" */
    sub: string;
    /**  "id-token" */
    type: string;
  };
}
