import {
  adminClient,
  genericOAuthClient,
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/svelte";
import { AccessControl } from "./auth/permissions";
import { toast } from "svelte-sonner";

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
