import adapter from "@sveltejs/adapter-vercel";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),

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

  compilerOptions: {
    experimental: {
      async: true,
    },
  },
};

export default config;
