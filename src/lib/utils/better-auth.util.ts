import type { MaybePromise } from "$lib/interfaces";
import type { APIResult } from "./form.util";
import { err, suc } from "./result.util";

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
    options?: { fallback?: string },
  ): Promise<APIResult<D>> => {
    const awaited = res instanceof Promise ? await res : res;

    if (awaited.data) {
      return suc(awaited.data);
    } else {
      console.warn("BetterAuth error:", awaited.error);
      return err({
        message:
          awaited.error?.message ??
          awaited.error?.statusText ??
          options?.fallback ??
          "An unknown error occurred",
      });
    }
  },
};
