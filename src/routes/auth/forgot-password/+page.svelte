<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import { Client } from "$lib/clients/index.client";
  import EmailFormField from "$lib/components/form/fields/EmailFormField.svelte";
  import FormMessage from "$lib/components/form/FormMessage.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
  import { ROUTES } from "$lib/const/routes.const";
  import { make_super_form } from "$lib/utils/form.util";
  import { defaults } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import { z } from "zod/mini";

  const validators = zod4Client(
    z.object({ email: z.email("Please enter a valid email address.") }),
  );

  const form = make_super_form(defaults({ email: "" }, validators), {
    SPA: true,
    validators,

    submit: (data) =>
      Client.better_auth(
        () =>
          BetterAuthClient.requestPasswordReset({
            ...data,
            redirectTo: ROUTES.AUTH_RESET_PASSWORD,
          }),
        {
          validate_session: false,
          toast: { success: "Password reset email sent" },
        },
      ),
  });

  const { form: form_data } = form;
</script>

<Card
  title="Forgot your password?"
  description="Enter your email to reset it"
  class="mx-auto w-full max-w-xs"
>
  {#snippet content()}
    <form method="POST" class="flex flex-col gap-2" use:form.enhance>
      <EmailFormField {form} bind:value={$form_data.email} />

      <FormButton {form} icon="heroicons/envelope">
        Request password reset
      </FormButton>

      <FormMessage message={form.message} />
    </form>
  {/snippet}
</Card>
