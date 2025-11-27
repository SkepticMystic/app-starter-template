import type { MaybePromise } from "$lib/interfaces";
import { result } from "./result.util";

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

    if (awaited.data) {
      return result.suc(awaited.data);
    } else {
      console.warn("BetterAuth error:", awaited.error);
      return result.err({
        message:
          awaited.error?.message ??
          awaited.error?.statusText ??
          "An unknown error occurred",
      });
    }
  },
};
