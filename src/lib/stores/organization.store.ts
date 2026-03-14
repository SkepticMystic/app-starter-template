import { BetterAuthClient } from "$lib/auth-client";

export const member = BetterAuthClient.useActiveMember();
export const organization = BetterAuthClient.useActiveOrganization();
