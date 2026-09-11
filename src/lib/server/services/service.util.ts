import { ERROR } from "$lib/const/error.const";
import type { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";

/** Only the methods these need, so a caller can pass a child logger or a test double. */
type ServiceLogger = Pick<typeof Log, "error">;
type RelayLogger = Pick<typeof Log, "error" | "info">;

/**
 * The tail that most service methods share: log the failure against the method
 * that produced it, file it, and answer 500.
 *
 * Worth being one function because of `extra`, not because of the line count.
 * Whether a method's `input` reaches Sentry is a **privacy** decision rather
 * than a debugging convenience — and spread across dozens of copy-pasted catch
 * blocks, that judgement gets re-made from scratch by whoever pasted last, with
 * no single place to review it. It is now one argument per method.
 *
 * Deliberately **not** a `try` wrapper. Wrapping each body would change every
 * service's declaration style — they are `export async function` / `const`
 * inside an object — for no gain the catch itself does not already provide.
 *
 * The log line keeps its `<scope>.error unknown` wording, so existing log
 * queries and alerts still match.
 */
export const internal = (
  error: unknown,
  ctx: {
    log: ServiceLogger;
    /** The method name, so the line still reads `list.error unknown`. */
    scope: string;
    /**
     * Attached to the Sentry event. Omit it for anything a user typed,
     * uploaded, or would be surprised to find in an error tracker.
     */
    extra?: Record<string, unknown>;
  },
): App.Result<never> => {
  ctx.log.error(error, `${ctx.scope}.error unknown`);

  captureException(error, ctx.extra ? { extra: ctx.extra } : undefined);

  return result.err(ERROR.INTERNAL_SERVER_ERROR);
};

/**
 * The same tail, for a method that called Better-Auth.
 *
 * An `APIError` is Better-Auth *answering* — a taken slug, a password it will
 * not accept — so it is logged at `info` and relayed with its own status;
 * anything else is ours and answers 500. Both of those were only true by
 * coincidence across the hand-copied versions: that a Better-Auth refusal logs
 * at `info` rather than `error`, and that its status comes from
 * `from_ba_error` rather than a hardcoded 400.
 *
 * Methods that additionally map specific codes onto a field path — e.g.
 * `is_ba_error_code(error, "INVALID_PASSWORD")` becoming `path: ["password"]` —
 * deliberately keep their own bodies. What each does with a recognised code is
 * the one interesting line in the method, and folding it into an option here
 * would bury it.
 */
export const ba_error = (
  error: unknown,
  ctx: {
    log: RelayLogger;
    /**
     * Replaces the generic 500 wording for the *non*-`APIError` branch, which
     * is the only branch whose message this layer chooses — a Better-Auth
     * refusal already carries its own.
     */
    message?: string;
  },
): App.Result<never> => {
  if (error instanceof APIError) {
    ctx.log.info(error.body, "error better-auth");

    captureException(error);

    return result.from_ba_error(error);
  }

  ctx.log.error(error, "error unknown");

  captureException(error);

  return result.err(
    ctx.message
      ? { ...ERROR.INTERNAL_SERVER_ERROR, message: ctx.message }
      : ERROR.INTERNAL_SERVER_ERROR,
  );
};

/**
 * The org on a session, or the refusal a writer starts with.
 *
 * A service that stamps `org_id` onto a row needs the id as a `string`, not as
 * `string | null`, and the refusal is the same everywhere: no active org means
 * there is nothing to write against.
 */
export const session_org = (session: App.Session): App.Result<string> =>
  session.session.org_id
    ? result.suc(session.session.org_id)
    : result.err(ERROR.FORBIDDEN);

/** The member behind a session, or the refusal — for rows that record who acted. */
export const session_member = (session: App.Session): App.Result<string> =>
  session.session.member_id
    ? result.suc(session.session.member_id)
    : result.err(ERROR.FORBIDDEN);

export const ServiceUtil = {
  internal,
  ba_error,
  session_org,
  session_member,
};
