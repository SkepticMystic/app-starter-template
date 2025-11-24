import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { session } from "$lib/stores/session";
import { BetterAuth, type BetterAuthResult } from "$lib/utils/better-auth.util";
import { err } from "$lib/utils/result.util";
import { Toast, type ToastPromiseOptions } from "$lib/utils/toast/toast.util";
import { HTTPError } from "ky";
import { toast } from "svelte-sonner";
import { get } from "svelte/store";

// Run a cb, and catch any errors into a Result with a level
const inner_request = async <D>(
  cb: () => Promise<App.Result<D>>,
): Promise<App.Result<D>> => {
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

type ClientRequestOptions<D> = {
  confirm?: string;
  validate_session?: boolean;
  toast?: ToastPromiseOptions<D>;
};

/** Handles toast before n after an http request */
const request = async <D>(
  cb: () => Promise<App.Result<D>>,
  options?: ClientRequestOptions<D>,
): Promise<App.Result<D>> => {
  toast.dismiss();

  if (options?.validate_session !== false && !get(session).data?.session) {
    toast.warning(
      "Your session has expired. Please signin again to continue.",
      {
        action: {
          label: "Sign in",
          onClick: () => goto(resolve("/auth/signin")),
        },
      },
    );

    // Don't return a message or level, as we've already shown a toast
    return err();
  } else if (options?.confirm && !confirm(options.confirm)) {
    return err();
  }

  const promise = inner_request(cb);
  Toast.promise(promise, options?.toast);

  return await promise;
};

const better_auth = async <D>(
  cb: () => Promise<BetterAuthResult<D>>,
  {
    fallback,
    ...options
  }: ClientRequestOptions<D> & { fallback?: string } = {},
): Promise<App.Result<D>> =>
  request(() => BetterAuth.to_result(cb(), { fallback }), options);

export const Client = { request, better_auth };
