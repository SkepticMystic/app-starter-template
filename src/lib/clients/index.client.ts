import { goto } from "$app/navigation";
import { ROUTES } from "$lib/const/routes.const";
import { session } from "$lib/stores/session";
import { BetterAuth, type BetterAuthResult } from "$lib/utils/better-auth.util";
import type { APIResult } from "$lib/utils/form.util";
import { err } from "$lib/utils/result.util";
import { Toast, type ToastPromiseOptions } from "$lib/utils/toast/toast.util";
import { Effect, pipe, Schedule } from "effect";
import { HTTPError } from "ky";
import { toast } from "svelte-sonner";
import { get } from "svelte/store";

const effect_request = async <D>(cb: () => Promise<APIResult<D>>) =>
  Effect.runPromise(
    pipe(
      Effect.tryPromise({
        try: () => cb(),
        catch: (error) => {
          console.error("Failed to create task:", error);
          throw error;
        },
      }),
      Effect.timeout("10 seconds"),
      Effect.retry({ times: 3, schedule: Schedule.exponential(1_000) }),
    ),
  );

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

type ClientRequestOptions = {
  confirm?: string;
  validate_session?: boolean;
  toast?: ToastPromiseOptions<any>;
};

/** Handles toast before n after an http request */
const request = async <D>(
  cb: () => Promise<APIResult<D>>,
  options?: ClientRequestOptions,
): Promise<APIResult<D>> => {
  toast.dismiss();

  if (options?.validate_session !== false && !get(session).data?.session) {
    toast.warning(
      "Your session has expired. Please signin again to continue.",
      { action: { label: "Sign in", onClick: () => goto(ROUTES.AUTH_SIGNIN) } },
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
  { fallback, ...options }: ClientRequestOptions & { fallback?: string } = {},
): Promise<APIResult<D>> =>
  request(() => BetterAuth.to_result(cb(), { fallback }), options);

export const Client = { request, better_auth };
