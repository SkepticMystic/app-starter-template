import { asset } from "$app/paths";
import { PUBLIC_BASE_URL } from "$env/static/public";

export const APP = {
  // NOTE: Intention is that this never changes
  // Currently used to add a fixed key prefix to Redis keys
  ID: "app-starter",
  NAME: "App Starter",
  URL: PUBLIC_BASE_URL,
  LOGO: asset("/favicon.png"),
  DOMAIN: new URL(PUBLIC_BASE_URL).hostname,
  DESCRIPTION: "An awesome app built with SvelteKit and BetterAuth",
};
