import adapter from "@sveltejs/adapter-node";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    /**
     * `precompress` is on by default and stays on: adapter-node's own static
     * handler serves the `.br`/`.gz` variants, so the reverse proxy does not
     * have to compress immutable assets on every request.
     */
    adapter: adapter(),

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

      /**
       * Every variable is declared in `src/env.ts` instead of being read from
       * `$env/static/*`.
       *
       * `$env/static/*` is inlined at build time. On Vercel that was free —
       * one build per tier — and in a container image it is two separate bugs:
       * production secrets are baked into image layers, where anyone who can
       * pull the image can read them, and one image cannot be promoted
       * dev -> preview -> prod, which defeats the point of a registry.
       *
       * Enabling this makes `$env/static/*` and `$env/dynamic/*` throw on
       * import, so the migration is all-or-nothing by design rather than by
       * discipline.
       */
      explicitEnvironmentVariables: true,
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
