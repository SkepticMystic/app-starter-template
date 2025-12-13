const CODES = ["NOT_FOUND", "INTERNAL_SERVER_ERROR"] as const;
export type AppErrorCode = (typeof CODES)[number];

export const ERROR = {
  NOT_FOUND: {
    status: 404,
    level: "error",
    code: "NOT_FOUND",
    message: "Not found",
  },
  INTERNAL_SERVER_ERROR: {
    status: 500,
    level: "error",
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  },
} satisfies {
  [C in AppErrorCode]: App.Error & { code: C; status: number };
};
