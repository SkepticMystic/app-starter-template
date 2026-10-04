import { Toast } from "#lib/utils/toast.util.js";
import { PUBLIC_BASE_URL } from "$app/env/public";
import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/client";

/**
 * Only for what has to run in the browser: the WebAuthn ceremony
 * (`PasskeySigninButton`, `PasskeyClient.create`) and the redirect to an OAuth
 * provider (`OAuthSigninButton`). Every other auth action is a remote function
 * calling `auth.api` on the server, so add nothing here.
 */
export const BetterAuthClient = createAuthClient({
  baseURL: PUBLIC_BASE_URL,

  plugins: [passkeyClient()],

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
