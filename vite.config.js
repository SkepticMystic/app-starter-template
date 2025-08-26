import { sveltekit } from "@sveltejs/kit/vite";
import Icons from "unplugin-icons/vite";

/** @type {import('vite').UserConfig} */
const config = {
  envPrefix: [
    "VITE_",
    // NOTE: SveltKit also exposes PUBLIC_ env vars, so we ask vite to expose them too for import.meta.env
    "PUBLIC_",
  ],
  plugins: [
    sveltekit(),

    Icons({
      compiler: "svelte",
      autoInstall: true,
    }),
  ],
};

export default config;
