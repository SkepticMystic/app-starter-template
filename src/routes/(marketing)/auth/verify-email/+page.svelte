<script lang="ts">
  import { page } from "$app/state";
  import FormButton from "#lib/components/form/FormButton.svelte";
  import { Toast } from "#lib/utils/toast.util.js";
  import FormErrors from "#lib/components/form/FormErrors.svelte";
  import Card from "#lib/components/ui/card/Card.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import { send_verification_email_remote } from "#lib/remote/auth/user.remote.js";

  const form = send_verification_email_remote;

  if (page.data.user) form.fields.email.set(page.data.user.email);
</script>

<Card
  class="mx-auto max-w-sm"
  heading="h1"
  title="Verify your email address"
  description="Check your inbox for a verification link. If it hasn't arrived, request another below."
>
  {#snippet children()}
    <form
      class="space-y-3"
      {...form.enhance(async ({ submit }) => {
        await submit();

        const res = form.result;
        if (res?.ok) {
          Toast.success(res.data.message);
        } else if (res?.error) {
          Toast.err(res.error);
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
            autocomplete="email"
          />
        {/snippet}
      </Field>

      <FormButton
        {form}
        class="w-full"
        icon="lucide/mail"
      >
        Resend verification email
      </FormButton>

      <FormErrors {form} />
    </form>
  {/snippet}
</Card>
