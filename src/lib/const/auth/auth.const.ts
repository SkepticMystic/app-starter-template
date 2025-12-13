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

const PASSWORD = {
  MIN_SCORE: 2 as const,
};

export const AUTH = {
  PROVIDERS: {
    IDS: PROVIDER_IDS,
    MAP: PROVIDER_MAP,
  },

  PASSWORD,
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
