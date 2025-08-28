import { partytownVite } from "@qwik.dev/partytown/utils";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import devtoolsJson from "vite-plugin-devtools-json";

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    tailwindcss(),
    sveltekit(),
    devtoolsJson(),
    partytownVite({ debug: false }),
  ],
};

export default config;
