import type { Result } from "$lib/interfaces";
import { err } from "$lib/utils/result.util";
import { HTTPError } from "ky";
import { toast } from "svelte-sonner";

export const Client = {
  request: async <D = unknown>(
    cb: () => Promise<Result<D, string>>,
    options?: { toast?: { suc?: string } },
  ) => {
    toast.dismiss();

    try {
      const res = await cb();

      if (res.ok) {
        if (options?.toast?.suc) {
          toast.success(options.toast.suc, { duration: 7_000 });
        }
      } else {
        toast.warning(res.error);
      }

      return res;
    } catch (error) {
      console.log("Client.request error", error);

      if (error instanceof HTTPError) {
        const msg = `HTTP Error: ${error.response.status} ${error.response.statusText}`;
        toast.error(msg);
        return err(msg);
      }

      return err("An unknown error occurred");
    }
  },
};
