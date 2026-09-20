import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import pino from "pino";

export const Log = pino({
  // Defaulted because LOG_LEVEL is no longer inlined at build time: pino throws
  // "default level:undefined must be included in custom levels" rather than
  // falling back, which took out the container build before this default.
  level: env.LOG_LEVEL || "info",

  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },

  transport: dev
    ? {
        target: "pino-pretty",
        options: {
          colorize: env.NO_COLOR !== "true",
          // translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});
