import { dev } from "$app/env";
import { LOG_LEVEL, NO_COLOR } from "$app/env/private";
import pino from "pino";

export const Log = pino({
  // Defaulted to `info` by its schema in `src/env.ts`.
  level: LOG_LEVEL,

  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },

  transport: dev
    ? {
        target: "pino-pretty",
        options: {
          colorize: NO_COLOR !== "true",
          // translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});
