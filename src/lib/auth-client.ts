import {
  adminClient,
  genericOAuthClient,
  organizationClient,
  passkeyClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import { AccessControl } from "./auth/permissions";
import { APP } from "./const/app";

export const BetterAuthClient = createAuthClient({
  baseURL: APP.URL,
  basePath: "/api/auth",

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
