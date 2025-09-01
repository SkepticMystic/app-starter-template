import { goto } from "$app/navigation";
import type { MaybePromise } from "$lib/interfaces";
import type { ActionResult } from "@sveltejs/kit";
import { toast } from "svelte-sonner";
import { get, writable } from "svelte/store";
import {
  superForm,
  type FormOptions,
  type Infer,
  type InferIn,
  type SuperValidated,
} from "sveltekit-superforms";
import {
  zod4Client,
  type ZodValidationSchema,
} from "sveltekit-superforms/adapters";
import { err } from "./result.util";

export type FormCommandResult<
  Out extends Record<string, unknown>,
  D extends Record<string, unknown>,
> = ActionResult<
  {
    form: SuperValidated<Out>;
    toast?: string;
    data: D;
  },
  {
    form: SuperValidated<Out>;
    /** Optionally pass a message to show at the bottom of the form (instead of in a FormFieldErrors)
     * This can be used to pass non-validation-error messages, e.g. "Internal server error, please try again later."
     */
    message?: Extract<App.Superforms.Message, { ok: false }>["error"];
  }
>;

export function make_super_form<
  S extends ZodValidationSchema,
  Out extends Infer<S, "zod4">,
  In extends InferIn<S, "zod4">,
  D extends Record<string, unknown> = Record<string, never>,
>(
  form: SuperValidated<Out, App.Superforms.Message, In>,
  schema: S,
  {
    remote,
    handle = {},
    invalidateAll: invalidate,

    onSubmit,
    onResult,
    ...rest
  }: FormOptions<Out, App.Superforms.Message, In> & {
    remote?: (data: Out) => Promise<FormCommandResult<Out, D>>;

    handle?: {
      [T in ActionResult["type"]]?: (
        result: Extract<FormCommandResult<Out, D>, { type: T }>,
      ) => MaybePromise<void>;
    };
  } = {},
) {
  const pending = writable(false);

  const super_form = superForm(form, {
    dataType: "json",
    validators: zod4Client(schema),
    taintedMessage: "You have unsaved changes. Are you sure you want to leave?",

    ...rest,

    onSubmit: async (event) => {
      pending.set(true);

      if (remote) {
        // NOTE: We don't want svelte to try submit to an action +page.server
        // The remote function handles that for us
        event.cancel();

        const result = await remote(get(super_form.form));
        console.log("remote result", result);

        if (result.type === "success") {
          super_form.errors.set({});
          super_form.tainted.set(undefined);

          if (result.data) {
            super_form.form.set(result.data.form.data);

            if (result.data.toast) {
              toast.success(result.data.toast);
            }
          }

          await handle?.success?.(result);

          pending.set(false);
        } else if (result.type === "redirect") {
          super_form.tainted.set(undefined);

          await handle?.redirect?.(result);

          await goto(result.location, { invalidateAll: invalidate !== false });

          return;
        } else if (result.type === "failure") {
          await handle?.failure?.(result);

          if (result.data) {
            super_form.errors.set(result.data.form.errors);
            super_form.form.set(result.data.form.data, { taint: true });
          }

          // NOTE: Only show message if one was explicitly passed.
          // Otherwise it's probably just a validation failure,
          // which the client already knows about.
          // (What I mean is, we could _build_ a message from form.errors)
          super_form.message.set(
            result.data?.message ? err(result.data.message) : undefined,
          );

          pending.set(false);
        } else if (result.type === "error") {
          // NOTE: Not really sure what to do here? What's an error vs a failure?
          await handle?.error?.(result);

          super_form.message.set(err("An unknown error occurred"));

          pending.set(false);
        }
      }

      onSubmit?.(event);
    },

    // NOTE: Not used in remote mode (we call event.cancel() in that case)
    onResult(event) {
      handle?.[event.result.type]?.(event.result);

      onResult?.(event);
    },
  });

  return {
    ...super_form,
    pending,
  };
}
