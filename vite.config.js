import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";
import devtoolsJson from "vite-plugin-devtools-json";

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    tailwindcss(),
    sveltekit(),
    Icons({ compiler: "svelte", autoInstall: true }),
    devtoolsJson(),
  ],
};

export default config;
