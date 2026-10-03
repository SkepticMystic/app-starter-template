import { ERROR } from "#lib/const/error.const.js";
import type { MaybePromise } from "#lib/interfaces/index.js";
import { Confirm } from "#lib/stores/confirm.svelte.js";
import {
  BetterAuth,
  type BetterAuthResult,
} from "#lib/utils/better-auth.util.js";
import { result } from "#lib/utils/result.util.js";
import { Toast, type ToastMessage } from "#lib/utils/toast.util.js";
import { captureException } from "@sentry/sveltekit";
import { isHttpError } from "@sveltejs/kit";

type ClientRequestOptions<I, D> = {
  /** Text the user must type back before the action runs. */
  prompt: ((input: I) => string) | string | null;
  /** "Question? What follows from yes." — the question is the dialog's title. */
  confirm: ((input: I) => string) | string | null;
  /** The confirm button in red: the action deletes, revokes or cannot be undone. */
  destructive: boolean;
  /** The confirm button's verb, matching the question ("Delete user"). "Continue" without. */
  action_label: string | null;
  /** A plain string is the title; a {@link ToastMessage} object adds a description. */
  suc_msg: ((input: I, data: D) => ToastMessage) | ToastMessage | null;
  on_success: ((data: D) => MaybePromise<unknown>) | null;
};
const DEFAULT_OPTIONS: ClientRequestOptions<unknown, unknown> = {
  prompt: null,
  confirm: null,
  destructive: false,
  action_label: null,
  suc_msg: null,
  on_success: null,
};

const wrap = <I, D>(
  cb: (
    input: I,
    options?: Partial<ClientRequestOptions<I, D>>,
  ) => Promise<App.Result<D>>,
  client_options?: Partial<ClientRequestOptions<I, D>>,
): typeof cb => {
  return async (input, callsite_options) => {
    const resolved: ClientRequestOptions<I, D> = {
      ...DEFAULT_OPTIONS,
      ...client_options,
      ...callsite_options,
    };

    // One dialog for both: a bulk delete asks its question *and* has its count typed back.
    if (resolved.confirm || resolved.prompt) {
      const message =
        typeof resolved.confirm === "function"
          ? resolved.confirm(input)
          : resolved.confirm;
      const target =
        typeof resolved.prompt === "function"
          ? resolved.prompt(input)
          : (resolved.prompt ?? undefined);

      const confirmed = await Confirm.ask({
        ...(message
          ? Confirm.from_message(message)
          : { title: "Are you sure?" }),
        destructive: resolved.destructive,
        action_label: resolved.action_label ?? undefined,
        type_to_confirm: target,
      });

      if (!confirmed) {
        return result.err({
          ...ERROR.INVALID_INPUT,
          message: "Action cancelled",
        });
      }
    }

    try {
      const res = await cb(input, resolved);

      if (res.ok) {
        if (resolved.suc_msg) {
          Toast.success(
            typeof resolved.suc_msg === "function"
              ? resolved.suc_msg(input, res.data)
              : resolved.suc_msg,
          );
        }

        if (resolved.on_success) {
          await resolved.on_success(res.data);
        }
      } else {
        // `warning`, unlike `FormUtil.enhance`. @see Toast.err
        Toast.err(res.error, "warning");
      }

      return res;
    } catch (error) {
      // Kit turns every remote failure into an `HttpError`: a 4xx such as a schema refusal, or a
      // 500 that `handleErrorWithSentry` already reported server-side. Neither is news to Sentry.
      if (isHttpError(error)) {
        Toast.err(error.body, error.body.level ?? "error");

        return result.err(error.body);
      } else {
        captureException(error);

        /**
         * Deliberately not "Internal server error". That is the shape of the
         * failure, not something the reader can act on — and it reads as though
         * they broke it. `captureException` above has already filed it.
         */
        Toast.error({
          title: "Something went wrong",
          description: "The error has been reported. Try again in a moment.",
        });

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }
  };
};

const better_auth = <I, D>(
  cb: (input: I) => Promise<BetterAuthResult<D>>,
  options?: Partial<ClientRequestOptions<I, D>>,
) => wrap((input) => BetterAuth.to_result(cb(input)), options);

export const Client = { wrap, better_auth };
