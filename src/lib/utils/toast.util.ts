import { ERROR, type AppErrorCode } from "#lib/const/error.const.js";
import { toast } from "svelte-sonner";

/**
 * A toast is either one line, or a heading plus a sentence that says something
 * the heading did not.
 *
 * Copy: the title is the outcome, sentence case, no trailing period, ~40
 * characters. The description is a full sentence that never restates the
 * title. No "successfully".
 */
export type ToastMessage =
  | string
  | {
      title: string;
      description?: string;
      action?: { label: string; onClick: () => void };
    };

type Level = "success" | "error" | "warning" | "info";

const show = (level: Level, message: ToastMessage) => {
  if (typeof message === "string") return toast[level](message);

  return toast[level](message.title, {
    description: message.description,
    action: message.action,
  });
};

/**
 * The codes worth giving a heading to.
 *
 * An allowlist rather than "always split", because for most failures the code's
 * own wording IS the whole message and a heading above it just says it twice.
 * These three are the ones where the code names a category and the detail says
 * which instance — "Conflict" over "This email already has a pending invite".
 */
const TITLED: ReadonlySet<AppErrorCode> = new Set([
  "CONFLICT",
  "PAYMENT_REQUIRED",
  "TOO_MANY_REQUESTS",
]);

/** Two strings saying the same thing, modulo casing and a trailing stop. */
const same = (a: string, b: string) =>
  a
    .trim()
    .replace(/[.!?]+$/, "")
    .toLowerCase() ===
  b
    .trim()
    .replace(/[.!?]+$/, "")
    .toLowerCase();

/**
 * Split an {@link App.Error} into a short title and the detail.
 *
 * An error is built as `{ ...ERROR.CONFLICT, message: <the detail> }`, so the
 * category and the specifics are both present. An explicit `description` wins;
 * a {@link TITLED} code whose `message` was overwritten becomes the title over
 * it; anything else is one line.
 */
const from_error = (error: App.Error): ToastMessage => {
  if (error.description) {
    return { title: error.message, description: error.description };
  }

  const canonical =
    error.code && TITLED.has(error.code) ? ERROR[error.code].message : null;

  if (!canonical || same(canonical, error.message)) return error.message;

  return { title: canonical, description: error.message };
};

/**
 * The app's one way to raise a toast. Import this, not `svelte-sonner`: the
 * `<Sonner />` component is the only other place that package is touched.
 */
export const Toast = {
  success: (message: ToastMessage) => show("success", message),
  error: (message: ToastMessage) => show("error", message),
  warning: (message: ToastMessage) => show("warning", message),
  info: (message: ToastMessage) => show("info", message),

  from_error,

  /** `level` is per caller: `Client.wrap` warns where `FormUtil.enhance` errors, by design. */
  err: (error: App.Error, level: "error" | "warning" = "error") =>
    show(level, from_error(error)),
};
