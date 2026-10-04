<script lang="ts">
  import CaptchaField from "#lib/components/form/auth/captcha/CaptchaField.svelte";
  import FormButton from "#lib/components/form/FormButton.svelte";
  import FormErrors from "#lib/components/form/FormErrors.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import { send_signin_code_remote } from "#lib/remote/auth/auth.remote.js";
  import { FormUtil } from "#lib/utils/form/form.util.svelte.js";

  let {
    email = "",
    on_sent,
  }: {
    /** Prefilled when asking again for the same address. */
    email?: string;
    on_sent: (email: string) => void;
  } = $props();

  const form = send_signin_code_remote;

  // Once, on mount: this form is remounted for each request.
  form.fields.email.set(email);

  let reset_captcha = $state<() => void>();
</script>

<form
  class="space-y-3"
  {...FormUtil.enhance(form, {
    metric: "email_code_request_form",
    // A Turnstile token is single-use, whatever the outcome.
    on_success: (data) => {
      reset_captcha?.();
      on_sent(data.email);
    },
    on_error: () => reset_captcha?.(),
  })}
>
  <Field
    label="Email"
    field={form.fields.email}
  >
    {#snippet input({ props, field })}
      <Input
        {...props}
        {...field?.as("email")}
        required
        autofocus
        autocomplete="username"
      />
    {/snippet}
  </Field>

  <CaptchaField
    {form}
    bind:reset={reset_captcha}
  />

  <FormButton
    {form}
    class="w-full"
    icon="lucide/mail"
  >
    Email me a code
  </FormButton>

  <FormErrors {form} />
</form>
