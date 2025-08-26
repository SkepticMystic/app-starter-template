import { dev } from "$app/environment";
import { PUBLIC_VERCEL, VERCEL, VITE_VERCEL } from "$env/static/public";

console.log({
  "SVELTE:VERCEL": VERCEL,
  "SVELTE:PUBLIC_VERCEL": PUBLIC_VERCEL,
  "SVELTE:VITE_VERCEL": VITE_VERCEL,
  "VITE:VITE_VERCEL": import.meta.env.VITE_VERCEL,
});

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

console.log({ APP });
