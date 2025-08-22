import type { Result } from "$lib/interfaces";
import { err } from "$lib/utils";
import { HTTPError } from "ky";
import { toast } from "svelte-daisyui-toast";

export const Client = {
  request: async <D = unknown>(
    cb: () => Promise<Result<D, string>>,
    options?: { toast?: { suc?: string } },
  ) => {
    toast.set([]);

    try {
      const res = await cb();

      if (res.ok) {
        if (options?.toast?.suc) {
          toast.add({
            type: "success",
            duration_ms: 7_000,
            message: options.toast.suc,
          });
        }
      } else {
        toast.add({
          type: "warning",
          message: res.error,
          duration_ms: undefined,
        });
      }

      return res;
    } catch (error) {
      console.log("Client.request error", error);

      if (error instanceof HTTPError) {
        const msg = `HTTP Error: ${error.response.status} ${error.response.statusText}`;
        toast.add({ type: "error", message: msg, duration_ms: undefined });
        return err(msg);
      }

      return err("An unknown error occurred");
    }
  },
};
