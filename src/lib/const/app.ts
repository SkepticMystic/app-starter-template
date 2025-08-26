import { dev } from "$app/environment";

export const APP = {
  NAME: "App Starter",

  URL: dev
    ? "http://localhost:5173"
    : import.meta.env.VITE_VERCEL
      ? `https://${import.meta.env.VITE_VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://TODO.com",

  DESCRIPTION: "An awesome app built with SvelteKit and BetterAuth",

  LOGO_URL: "https://placehold.co/600x400/png",
};
