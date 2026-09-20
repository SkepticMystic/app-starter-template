import node from "@sveltejs/adapter-node";
import vercel from "@sveltejs/adapter-vercel";

// Vercel sets VERCEL=1 on every build it runs. Anywhere else — Docker, a VPS,
// `pnpm preview` — build a standalone Node server instead.
//
// Deliberately not `adapter-auto`: it accepts no options, and it has no
// fallback to adapter-node for a plain container, so off-platform it warns and
// emits nothing — which is exactly the case this switch exists to make work.
const adapter = process.env.VERCEL ? vercel() : node();

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter,

    version: {
      pollInterval: 300_000,
    },

    experimental: {
      remoteFunctions: true,

      tracing: {
        server: true,
      },

      instrumentation: {
        server: true,
      },
    },
  },

  vitePlugin: {
    // experimental: { compileModule: true },
    dynamicCompileOptions: ({ filename }) =>
      filename.includes("node_modules") ? undefined : { runes: true },
  },

  compilerOptions: {
    experimental: {
      async: true,
    },
  },
};

export default config;
