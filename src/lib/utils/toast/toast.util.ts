import { toast } from "svelte-sonner";

export type ToastPromiseOptions<D> = {
  optimistic?: boolean;

  loading?: string;
  success?: string | ((res: D) => string);
};

export const Toast = {
  // NOTE: There's alot of manual toast weirdness here...
  // Unfortunately, because I return an err(string) on failure,
  // sonner sees it as a success, and shows it in green with the checkmark.
  // So we manually manage loading and toast_id
  // (Instead of simply being able to use toast.promise)
  promise: async <D>(
    promise: Promise<App.Result<D>>,
    options: ToastPromiseOptions<D> = {},
  ): Promise<App.Result<D>> => {
    const toast_id = Math.random().toString(36).substring(2, 8);

    if (options.loading) {
      toast.loading(options.loading, { id: toast_id });
    } else if (
      options.optimistic &&
      // NOTE: Can't use res in optimistic case
      typeof options.success === "string"
    ) {
      toast.success(options.success, { id: toast_id });
    }

    const res = await promise;

    if (res.ok) {
      if (options.success && !options.optimistic) {
        toast.success(
          typeof options.success === "function"
            ? options.success(res.data)
            : options.success,
          { id: toast_id },
        );
      }
    } else {
      console.log("Toast.promise !res.ok", res.error);
      if (res.error?.message) {
        toast[res.error.level ?? "warning"](res.error.message, {
          id: toast_id,
        });
      }
    }

    return res;
  },
};
