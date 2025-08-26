import {
  adminClient,
  genericOAuthClient,
  organizationClient,
  passkeyClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import { AccessControl } from "./auth/permissions";

export const BetterAuthClient = createAuthClient({
  plugins: [
    passkeyClient(),
    organizationClient(),
    genericOAuthClient(),
    adminClient({
      ac: AccessControl.ac,
      roles: AccessControl.roles,
    }),
  ],
});
