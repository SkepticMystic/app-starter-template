import type { FormSubmitResult } from "$lib/utils/form.util";
import { err } from "$lib/utils/result.util";
import { Toast, type ToastPromiseOptions } from "$lib/utils/toast/toast.util";
import { HTTPError } from "ky";
import { toast } from "svelte-sonner";

// Run a cb, and catch any errors into a Result with a level
const inner_request = async <D>(
  cb: () => Promise<FormSubmitResult<D>>,
): Promise<FormSubmitResult<D>> => {
  try {
    const res = await cb();

    return res;
  } catch (error) {
    console.log("Client.request error", error);

    if (error instanceof HTTPError) {
      const message = `HTTP Error: ${error.response.status} ${error.response.statusText}`;

      return err({ level: "error", message });
    } else {
      return err({ level: "error", message: "An unknown error occurred" });
    }
  }
};

export const Client = {
  /** Handles toast before n after an http request */
  request: async <D>(
    cb: () => Promise<FormSubmitResult<D>>,
    options?: { toast?: ToastPromiseOptions<D> },
  ): Promise<FormSubmitResult<D>> => {
    toast.dismiss();

    const promise = inner_request(cb);
    Toast.promise(promise, options?.toast);

    return await promise;
  },
};
