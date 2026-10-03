import { BetterAuthClient } from "#lib/auth-client.js";

export const member = BetterAuthClient.useActiveMember();
export const organization = BetterAuthClient.useActiveOrganization();
