<script lang="ts">
  import CaptchaField from "$lib/components/form/auth/captcha/CaptchaField.svelte";
  import FormButton from "$lib/components/form/FormButton.svelte";
  import FormErrors from "$lib/components/form/FormErrors.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { request_password_reset_remote } from "$lib/remote/auth/user.remote";
  import { toast } from "svelte-sonner";

  const form = request_password_reset_remote;

  let reset_captcha = $state<() => void>();
</script>

<article>
  <Card
    title="Forgot your password?"
    description="Enter your email to reset it"
    class="mx-auto w-full max-w-xs"
  >
    {#snippet content()}
      <form
        class="space-y-3"
        {...form.enhance(async (e) => {
          await e.submit();

          if (form.fields.allIssues()?.length) {
            reset_captcha?.();
          }

          const res = request_password_reset_remote.result;
          if (res?.ok) {
            e.form.reset();
            toast.success(res.data.message);
          } else if (res?.error.message) {
            toast.error(res.error.message);
          }
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
              autocomplete="email"
            />
          {/snippet}
        </Field>

        <CaptchaField
          {form}
          bind:reset={reset_captcha}
        />

        <FormButton
          {form}
          icon="lucide/mail"
        >
          Request password reset
        </FormButton>

        <FormErrors {form} />
      </form>
    {/snippet}
  </Card>
</article>
