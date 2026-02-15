import { paystackClient } from "@alexasomba/better-auth-paystack/client";
import { passkeyClient } from "@better-auth/passkey/client";
import {
  adminClient,
  genericOAuthClient,
  inferAdditionalFields,
  inferOrgAdditionalFields,
  lastLoginMethodClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
import { toast } from "svelte-sonner";
import type { auth } from "./auth";
import { AccessControl } from "./const/auth/access_control.const";

export const BetterAuthClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    passkeyClient(),
    twoFactorClient(),
    genericOAuthClient(),
    lastLoginMethodClient(),
    organizationClient({
      schema: inferOrgAdditionalFields<typeof auth>(),
    }),
    adminClient({
      ac: AccessControl.ac,
      roles: AccessControl.roles,
    }),

    paystackClient({ subscription: true }),
  ],

  fetchOptions: {
    onError: (ctx) => {
      // SOURCE: https://www.better-auth.com/docs/concepts/rate-limit#handling-rate-limit-errors
      if (ctx.response.status === 429) {
        const retry_after = ctx.response.headers.get("Retry-After");
        if (retry_after) {
          toast.warning(
            `Rate limit exceeded. Please try again in ${retry_after} seconds.`,
          );
        }
      }
    },
  },
});
