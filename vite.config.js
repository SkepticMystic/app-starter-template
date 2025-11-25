import { sentrySvelteKit } from "@sentry/sveltekit";
import { partytownVite } from "@qwik.dev/partytown/utils";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    sentrySvelteKit({
      sourceMapsUploadOptions: {
        org: "ross-keenan",
        project: "app-starter",
      },
    }),
    tailwindcss(),
    sveltekit(),
    partytownVite({ debug: false }),
  ],
};

export default config;
