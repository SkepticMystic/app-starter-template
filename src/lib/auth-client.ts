import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";

export const AuthClient = createAuthClient({
  plugins: [adminClient(), organizationClient()],
});
