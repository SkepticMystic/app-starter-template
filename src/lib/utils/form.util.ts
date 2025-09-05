import type { MaybePromise, Result } from "$lib/interfaces";
import { get, writable } from "svelte/store";
import {
  superForm,
  type FormOptions,
  type Infer,
  type InferIn,
  type SuperValidated,
} from "sveltekit-superforms";
import { type ZodValidationSchema } from "sveltekit-superforms/adapters";
import { err } from "./result.util";

export type APIResult<D> = Result<
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
  Schema extends ZodValidationSchema,
  In extends InferIn<Schema, "zod4">,
  Out extends Infer<Schema, "zod4">,
  Data,
>(
  form: SuperValidated<Out, App.Superforms.Message, In>,
  {
    delayMs,
    validators,
    invalidateAll: invalidate,

    submit,

    on_error,
    on_success,

    onSubmit,
    onResult,
    ...rest
  }: FormOptions<Out, App.Superforms.Message, In> & {
    submit: (data: Out) => Promise<APIResult<Data>>;

    on_success?: (data: Data) => MaybePromise<void>;

    on_error?: (
      result: Extract<APIResult<Data>, { ok: false }>["error"],
    ) => MaybePromise<void>;
  },
) {
  const pending = writable(false);

  const super_form = superForm(form, {
    validators,
    dataType: "json",
    delayMs: delayMs ?? 500,
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

      const result = await submit(get(super_form.form));
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
