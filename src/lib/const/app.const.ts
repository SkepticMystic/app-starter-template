import { asset } from "$app/paths";
import { PUBLIC_BASE_URL } from "$app/env/public";

export const APP = {
  // NOTE: Intention is that this never changes
  // Currently used to add a fixed key prefix to Redis keys
  ID: "app-starter",
  NAME: "App Starter",
  URL: PUBLIC_BASE_URL,
  /** 1200×630, rendered by `pnpm brand:generate` with the name and description on it. */
  OG_IMAGE: asset("og-image.png"),
  DOMAIN: new URL(PUBLIC_BASE_URL).hostname,
  DESCRIPTION: "An awesome app built with SvelteKit and BetterAuth",
};
