import { goto } from "$app/navigation";
import { ROUTES } from "$lib/const/routes.const";
import { session } from "$lib/stores/session";
import type { APIResult } from "$lib/utils/form.util";
import { err } from "$lib/utils/result.util";
import { Toast, type ToastPromiseOptions } from "$lib/utils/toast/toast.util";
import { HTTPError } from "ky";
import { toast } from "svelte-sonner";
import { get } from "svelte/store";

// Run a cb, and catch any errors into a Result with a level
const inner_request = async <D>(
  cb: () => Promise<APIResult<D>>,
): Promise<APIResult<D>> => {
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
    cb: () => Promise<APIResult<D>>,
    options?: {
      validate_session?: boolean;
      toast?: ToastPromiseOptions<D>;
    },
  ): Promise<APIResult<D>> => {
    toast.dismiss();

    if (options?.validate_session !== false) {
      const $session = get(session);

      if (!$session.data?.session) {
        toast.warning(
          "Your session has expired. Please signin again to continue.",
          {
            action: {
              label: "Sign in",
              onClick: () => goto(ROUTES.AUTH_SIGNIN),
            },
          },
        );

        // Don't return a message or level, as we've already shown a toast
        return err();
      }
    }

    const promise = inner_request(cb);
    Toast.promise(promise, options?.toast);

    return await promise;
  },
};
