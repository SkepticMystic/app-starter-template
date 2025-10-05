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

export type APIResult<D> = Result<D, App.Error | undefined>;

export function make_super_form<
  Schema extends ZodValidationSchema,
  In extends InferIn<Schema, "zod4">,
  Out extends Infer<Schema, "zod4">,
  Data,
>(
  form: SuperValidated<Out, App.Superforms.Message, In>,
  {
    validators,

    submit,
    onSubmit,

    on_error,
    on_success,

    ...rest
  }: FormOptions<Out, App.Superforms.Message, In> & {
    submit: (data: Out) => Promise<APIResult<Data>>;
    on_success?: (data: Data) => MaybePromise<unknown>;
    on_error?: (result: App.Error | undefined) => MaybePromise<unknown>;
  },
) {
  const pending = writable(false);

  const super_form = superForm(form, {
    validators,
    delayMs: 500,
    dataType: "json",
    taintedMessage: "You have unsaved changes. Are you sure you want to leave?",

    ...rest,

    onSubmit: async (event) => {
      pending.set(true);

      // NOTE: We don't want svelte to try submit to an action +page.server
      // The submit function handles that for us
      event.cancel();

      if (validators) {
        // Prevent remote submission if the client state isn't valid
        const validated = await super_form.validateForm({ update: true });
        if (!validated.valid) {
          pending.set(false);
          return;
        }
      }

      const result = await submit(get(super_form.form));
      console.log("submit result", result);

      if (result.ok) {
        super_form.errors.set({});
        super_form.tainted.set(undefined);

        await on_success?.(result.data);
      } else {
        if (result.error?.path) {
          super_form.errors.set(
            { [result.error.path.join(".")]: [result.error.message] },
            { force: true },
          );
        } else if (result.error?.message) {
          super_form.message.set(err(result.error.message));
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
