import { dev } from "$app/environment";
import { LOG_LEVEL, NO_COLOR } from "$env/static/private";
import pino from "pino";
import z from "zod";

const LEVELS = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
] as const;

const config = z
  .object({
    LOG_LEVEL: z.enum(LEVELS).default("info"),
    NO_COLOR: z
      .string()
      .transform((s) => s === "true")
      .optional(),
  })
  .parse({
    LOG_LEVEL,
    NO_COLOR,
  });

export const Log = pino({
  level: config.LOG_LEVEL,

  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },

  transport: dev
    ? {
        target: "pino-pretty",
        options: {
          colorize: !config.NO_COLOR,
          // translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});
