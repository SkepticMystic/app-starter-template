import { toast } from "svelte-sonner";

/**
 * A toast is either one line, or a heading plus a sentence that says something
 * the heading did not.
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
const TITLED: Partial<Record<string, string>> = {
  CONFLICT: "Conflict",
  PAYMENT_REQUIRED: "Payment required",
  TOO_MANY_REQUESTS: "Too many requests",
};

/** Two strings saying the same thing, modulo punctuation and case. */
const same = (a: string, b: string) =>
  a.replaceAll(/[.\s]+$/g, "").toLowerCase() ===
  b.replaceAll(/[.\s]+$/g, "").toLowerCase();

export const Toast = {
  success: (message: ToastMessage) => show("success", message),
  error: (message: ToastMessage) => show("error", message),
  warning: (message: ToastMessage) => show("warning", message),
  info: (message: ToastMessage) => show("info", message),

  /**
   * Render an `App.Error`, using the split it already carries.
   *
   * An error is built as `{ ...ERROR.CONFLICT, message: <the detail> }`, so the
   * category and the specifics are both present — and only the detail was ever
   * shown. Where the code earns a heading (see {@link TITLED}) this renders
   * both, and suppresses the duplicate when they say the same thing.
   */
  err: (error: App.Error, level: Level = "error") => {
    const title = error.code ? TITLED[error.code] : undefined;

    if (!title || same(title, error.message)) {
      return show(level, error.message);
    }

    return show(level, { title, description: error.message });
  },
};
