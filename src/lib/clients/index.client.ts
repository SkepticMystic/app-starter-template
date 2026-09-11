import type { MaybePromise } from "$lib/interfaces";
import { Toast } from "$lib/utils/toast.util";
import { BetterAuth, type BetterAuthResult } from "$lib/utils/better-auth.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { isHttpError } from "@sveltejs/kit";
import { toast } from "svelte-sonner";

type ClientRequestOptions<I, D> = {
  prompt: ((input: I) => string) | string | null;
  confirm: ((input: I) => string) | string | null;
  suc_msg: ((input: I, data: D) => string) | string | null;
  on_success: ((data: D) => MaybePromise<unknown>) | null;
};
const DEFAULT_OPTIONS: ClientRequestOptions<unknown, unknown> = {
  prompt: null,
  confirm: null,
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

    if (resolved.confirm) {
      if (
        !confirm(
          typeof resolved.confirm === "function" //
            ? resolved.confirm(input)
            : resolved.confirm,
        )
      ) {
        return result.err({
          message: "Action cancelled",
        });
      }
    }

    if (resolved.prompt) {
      const target =
        typeof resolved.prompt === "function"
          ? resolved.prompt(input)
          : resolved.prompt;

      if (prompt(`Type "${target}" to confirm`) !== target) {
        return result.err({
          message: "Action cancelled",
        });
      }
    }

    try {
      const res = await cb(input, resolved);

      if (res.ok) {
        if (resolved.suc_msg) {
          toast.success(
            typeof resolved.suc_msg === "function"
              ? resolved.suc_msg(input, res.data)
              : resolved.suc_msg,
          );
        }

        if (resolved.on_success) {
          await resolved.on_success(res.data);
        }
      } else {
        Toast.err(res.error, "warning");
      }

      return res;
    } catch (error) {
      captureException(error);

      if (isHttpError(error)) {
        Toast.err(error.body, error.body.level ?? "error");

        return result.err(error.body);
      } else {
        /**
         * Deliberately not "Internal server error". That is the shape of the
         * failure, not something the reader can act on — and it reads as though
         * they broke it. `captureException` above has already filed it.
         */
        Toast.error({
          title: "Something went wrong",
          description: "The error has been reported. Try again in a moment.",
        });

        return result.err({
          message: "Internal server error",
        });
      }
    }
  };
};

const better_auth = <I, D>(
  cb: (input: I) => Promise<BetterAuthResult<D>>,
  options?: Partial<ClientRequestOptions<I, D>>,
) => wrap((input) => BetterAuth.to_result(cb(input)), options);

export const Client = { wrap, better_auth };
