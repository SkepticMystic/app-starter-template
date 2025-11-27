import { BetterAuthClient } from "$lib/auth-client";
import { derived } from "svelte/store";

export const session = BetterAuthClient.useSession();

export const user = derived(
  session,
  ($session) => $session?.data?.user ?? null,
);
