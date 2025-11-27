import { BetterAuthClient } from "$lib/auth-client";

export const organization = BetterAuthClient.useActiveOrganization();
