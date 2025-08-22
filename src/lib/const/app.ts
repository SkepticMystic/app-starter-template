import { dev } from "$app/environment";

export const APP = {
  NAME: "Generic App",
  URL: dev ? "http://localhost:5173" : "https://TODO.app",
  DESCRIPTION: "An awesome app built with SvelteKit and BetterAuth",

  LOGO_URL: "https://placehold.co/600x400/png",
};
