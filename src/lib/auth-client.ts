import {
  adminClient,
  genericOAuthClient,
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/svelte";
import { AccessControl } from "./auth/permissions";

export const BetterAuthClient = createAuthClient({
  plugins: [
    passkeyClient(),
    organizationClient(),
    genericOAuthClient(),
    lastLoginMethodClient(),
    adminClient({
      ac: AccessControl.ac,
      roles: AccessControl.roles,
    }),
  ],
});

export const $ERROR_CODES = BetterAuthClient.$ERROR_CODES;
