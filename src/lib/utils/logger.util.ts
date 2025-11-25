import { dev } from "$app/environment";
import { LOG_LEVEL, NO_COLOR } from "$env/static/private";
import pino from "pino";

export const Log = pino({
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
          colorize: !NO_COLOR,
          // translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});
