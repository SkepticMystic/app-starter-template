<script lang="ts">
  import { resolve } from "$app/paths";
  import { BetterAuthClient } from "$lib/auth-client";
  import { Client } from "$lib/clients/index.client";
  import FormFieldControl from "$lib/components/form/fields/FormFieldControl.svelte";
  import FormMessage from "$lib/components/form/FormMessage.svelte";
  import SuperformInput from "$lib/components/form/inputs/SuperformInput.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
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
            redirectTo: resolve("/auth/reset-password"),
          }),
        {
          validate_session: false,
          toast: { success: "Password reset email sent" },
        },
      ),
  });
</script>

<Card
  title="Forgot your password?"
  description="Enter your email to reset it"
  class="mx-auto w-full max-w-xs"
>
  {#snippet content()}
    <form
      method="POST"
      class="flex flex-col gap-2"
      use:form.enhance
    >
      <FormFieldControl
        {form}
        name="email"
        label="Email"
      >
        {#snippet children({ props })}
          <SuperformInput
            {...props}
            {form}
            type="email"
            autocomplete="email"
          />
        {/snippet}
      </FormFieldControl>

      <FormButton
        {form}
        icon="lucide/mail">Request password reset</FormButton
      >

      <FormMessage {form} />
    </form>
  {/snippet}
</Card>
