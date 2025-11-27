import { captureException } from "@sentry/sveltekit";

export const Sentry = {
  capture: {
    exception: (error: unknown, ctx?: Capture) => {
      captureException(error, ctx);
    },
  },
};
