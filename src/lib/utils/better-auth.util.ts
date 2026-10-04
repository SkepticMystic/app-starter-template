import type { MaybePromise } from "#lib/interfaces/index.js";
import { result } from "./result.util.js";

export type BetterAuthResult<D> =
  | {
      data: D;
      error: null;
    }
  | {
      data: null;
      error: {
        code?: string | undefined;
        message?: string | undefined;
        status: number;
        statusText: string;
      };
    };

export const BetterAuth = {
  /** Transform a better-auth result into one of mine */
  to_result: async <D>(
    res: MaybePromise<BetterAuthResult<D>>,
  ): Promise<App.Result<D>> => {
    const awaited = res instanceof Promise ? await res : res;

    // On `error`, not `data`: a success can carry a falsy `data`.
    if (awaited.error === null) {
      return result.suc(awaited.data);
    } else {
      return result.err({
        status: awaited.error.status || 500,
        message:
          awaited.error.message ||
          awaited.error.statusText ||
          "An unknown error occurred",
      });
    }
  },
};
