const CODES = [
  "INVALID_INPUT",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "DUPLICATE",
  "INTERNAL_SERVER_ERROR",
] as const;
export type AppErrorCode = (typeof CODES)[number];

export const ERROR = {
  INVALID_INPUT: {
    status: 400,
    level: "error",
    code: "INVALID_INPUT",
    message: "Invalid input",
  },
  UNAUTHORIZED: {
    status: 401,
    level: "error",
    code: "UNAUTHORIZED",
    message: "Unauthorized",
  },
  FORBIDDEN: {
    status: 403,
    level: "error",
    code: "FORBIDDEN",
    message: "Forbidden",
  },
  NOT_FOUND: {
    status: 404,
    level: "error",
    code: "NOT_FOUND",
    message: "Not found",
  },
  DUPLICATE: {
    status: 409,
    level: "error",
    code: "DUPLICATE",
    message: "Duplicate",
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
