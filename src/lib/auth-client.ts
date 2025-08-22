import {
  adminClient,
  organizationClient,
  passkeyClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";

export const BetterAuthClient = createAuthClient({
  plugins: [adminClient(), passkeyClient(), organizationClient()],
});
