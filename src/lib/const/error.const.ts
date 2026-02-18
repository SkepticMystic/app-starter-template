const CODES = [
  "INVALID_INPUT",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "TIMEOUT",
  "DUPLICATE",
  "TOO_LARGE",
  "UNSUPPORTED_MEDIA_TYPE",
  "TOO_MANY_REQUESTS",
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
  TIMEOUT: {
    status: 408,
    level: "error",
    code: "TIMEOUT",
    message: "Request timed out",
  },
  DUPLICATE: {
    status: 409,
    level: "error",
    code: "DUPLICATE",
    message: "Duplicate",
  },
  TOO_LARGE: {
    status: 413,
    level: "error",
    code: "TOO_LARGE",
    message: "Too large",
  },
  UNSUPPORTED_MEDIA_TYPE: {
    status: 415,
    level: "error",
    code: "UNSUPPORTED_MEDIA_TYPE",
    message: "Unsupported media type",
  },
  TOO_MANY_REQUESTS: {
    status: 429,
    level: "error",
    code: "TOO_MANY_REQUESTS",
    message: "Too many requests",
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
