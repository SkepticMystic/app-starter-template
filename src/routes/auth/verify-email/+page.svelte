<script lang="ts">
  import { UserClient } from "$lib/clients/user.client";
  import EmailFormField from "$lib/components/form/fields/EmailFormField.svelte";
  import FormMessage from "$lib/components/form/FormMessage.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
  import { make_super_form } from "$lib/utils/form.util";
  import { defaults } from "sveltekit-superforms";
  import { zod4 } from "sveltekit-superforms/adapters";
  import { z } from "zod/mini";

  const validators = zod4(z.object({ email: z.email() }));

  const form = make_super_form(defaults(validators), {
    SPA: true,
    validators,
    submit: (data) => UserClient.send_verification_email(data.email),
  });

  const { form: form_data } = form;
</script>

<Card
  class="mx-auto max-w-sm"
  title="Verify your email address"
  description="A verification link has been sent to your email address. Please check your inbox and click the link to verify your email."
>
  {#snippet content()}
    <form class="flex flex-col gap-2" method="POST" use:form.enhance>
      <EmailFormField {form} bind:value={$form_data.email} />

      <FormButton {form} icon="lucide/mail">
        Resend verification email
      </FormButton>

      <FormMessage {form} />
    </form>
  {/snippet}
</Card>
