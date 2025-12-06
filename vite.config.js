import { partytownVite } from "@qwik.dev/partytown/utils";
import { sentrySvelteKit } from "@sentry/sveltekit";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import sonda from "sonda/sveltekit";

const SONDA = process.env.SONDA;

/** @type {import('vite').UserConfig} */
const config = {
  build: { sourcemap: Boolean(SONDA) },
  plugins: [
    sentrySvelteKit({
      telemetry: false,
      sourceMapsUploadOptions: { org: "ross-keenan", project: "app-starter" },
    }),
    tailwindcss(),
    sveltekit(),
    partytownVite({ debug: false }),
  ],
};

if (SONDA) {
  config.plugins?.push(
    sonda({
      server: true,
      open: false,
      deep: true,
      sources: true,
    }),
  );
}

export default config;
