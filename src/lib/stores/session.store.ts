import { BetterAuthClient } from "#lib/auth-client.js";

/**
 * Better-Auth's client session. Empty during SSR, so UI reads `page.data.user` / `page.data.org`
 * (the root layout's server load) instead; this is for what only the client store has, such as
 * the session id umami is told.
 */
export const session = BetterAuthClient.useSession();
