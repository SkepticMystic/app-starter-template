import { Toast } from "#lib/utils/toast.util.js";
import { PUBLIC_BASE_URL } from "$app/env/public";
import { paystackClient } from "better-auth-paystack/client";
import { apiKeyClient } from "@better-auth/api-key/client";
import { passkeyClient } from "@better-auth/passkey/client";
import {
  adminClient,
  inferAdditionalFields,
  inferOrgAdditionalFields,
  lastLoginMethodClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import type { auth } from "./auth.js";
import { AccessControl } from "./const/auth/access_control.const.js";
import { OrgAccessControl } from "./const/auth/organization_access_control.const.js";

export const BetterAuthClient = createAuthClient({
  baseURL: PUBLIC_BASE_URL,

  plugins: [
    inferAdditionalFields<typeof auth>(),
    passkeyClient(),
    twoFactorClient(),
    lastLoginMethodClient(),
    organizationClient({
      ac: OrgAccessControl.ac,
      roles: OrgAccessControl.roles,
      schema: inferOrgAdditionalFields<typeof auth>(),
    }),
    adminClient({
      ac: AccessControl.ac,
      roles: AccessControl.roles,
    }),
    apiKeyClient(),

    paystackClient({ subscription: true }),
  ],

  fetchOptions: {
    onError: (ctx) => {
      // SOURCE: https://www.better-auth.com/docs/concepts/rate-limit#handling-rate-limit-errors
      if (ctx.response.status === 429) {
        const retry_after = ctx.response.headers.get("Retry-After");
        if (retry_after) {
          Toast.warning(
            `Rate limit exceeded. Please try again in ${retry_after} seconds.`,
          );
        }
      }
    },
  },
});
