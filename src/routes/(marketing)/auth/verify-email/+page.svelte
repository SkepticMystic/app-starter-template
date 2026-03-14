<script lang="ts">
  import FormButton from "$lib/components/form/FormButton.svelte";
  import FormErrors from "$lib/components/form/FormErrors.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { send_verification_email_remote } from "$lib/remote/auth/user.remote";
  import { toast } from "svelte-sonner";

  const form = send_verification_email_remote;
</script>

<Card
  class="mx-auto max-w-sm"
  title="Verify your email address"
  description="A verification link has been sent to your email address. Please check your inbox and click the link to verify your email."
>
  {#snippet content()}
    <form
      class="space-y-3"
      {...form.enhance(async ({ submit }) => {
        await submit();

        const res = form.result;
        if (res?.ok) {
          toast.success(res.data.message);
        } else if (res?.error) {
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
