import { Client } from "$lib/clients/index.client";
import type { MaybePromise, Result } from "$lib/interfaces";
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
import type { ToastPromiseOptions } from "./toast/toast.util";

export type FormSubmitResult<D> = Result<
  D,
  /** Optionally pass a message to show at the bottom of the form (instead of in a FormFieldErrors)
   * This can be used to pass non-validation-error messages, e.g. "Internal server error, please try again later."
   */
  | {
      message: string;
      /** Defaults to warning */
      level?: "warning" | "error";
    }
  | undefined
>;

export function make_super_form<
  S extends ZodValidationSchema,
  Out extends Infer<S, "zod4">,
  In extends InferIn<S, "zod4">,
  D,
>(
  form: SuperValidated<Out, App.Superforms.Message, In>,
  schema: S,
  {
    delayMs = 500,
    invalidateAll: invalidate,

    submit,

    on_error,
    on_success,

    onSubmit,
    onResult,
    ...rest
  }: FormOptions<Out, App.Superforms.Message, In> & {
    submit: (data: Out) => Promise<FormSubmitResult<D>>;

    toast?: ToastPromiseOptions<D>;

    on_success?: (data: D) => MaybePromise<unknown>;

    on_error?: (
      result: Extract<FormSubmitResult<D>, { ok: false }>["error"],
    ) => MaybePromise<unknown>;
  },
) {
  const pending = writable(false);

  const super_form = superForm(form, {
    delayMs,

    dataType: "json",
    validators: zod4Client(schema),
    taintedMessage: "You have unsaved changes. Are you sure you want to leave?",

    ...rest,

    onSubmit: async (event) => {
      pending.set(true);

      // NOTE: We don't want svelte to try submit to an action +page.server
      // The submit function handles that for us
      event.cancel();

      // Prevent remote submission if the client state isn't even valid
      // SuperForms doesn't seem to do this by default
      const validated = await super_form.validateForm({ update: true });
      if (!validated.valid) {
        pending.set(false);
        return;
      } else {
        super_form.errors.set({});
        super_form.message.set(undefined);
      }

      const result = await Client.request(() => submit(get(super_form.form)), {
        toast: rest.toast,
      });

      console.log("submit result", result);

      if (result.ok) {
        super_form.tainted.set(undefined);

        await on_success?.(result.data);
      } else {
        // NOTE: Only show message if one was explicitly passed.
        // Otherwise it's probably just a validation failure,
        // which the client already knows about.
        // (What I mean is, we could _build_ a message from form.errors)
        if (result.error?.message) {
          super_form.message.set(err(result.error.message));
          super_form.errors.set({ _errors: [result.error.message] });
        }

        await on_error?.(result.error);
      }

      pending.set(false);

      onSubmit?.(event);
    },
  });

  return {
    ...super_form,
    pending,
  };
}
