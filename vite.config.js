import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import devtoolsJson from "vite-plugin-devtools-json";

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
};

export default config;
