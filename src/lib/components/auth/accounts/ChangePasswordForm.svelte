<script lang="ts">
  import { AccountsClient } from "$lib/clients/accounts.client";
  import FormFieldControl from "$lib/components/form/fields/FormFieldControl.svelte";
  import FormMessage from "$lib/components/form/FormMessage.svelte";
  import SuperformInput from "$lib/components/form/inputs/SuperformInput.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
  import { AuthSchema } from "$lib/schema/auth.schema";
  import { make_super_form } from "$lib/utils/form.util";
  import { defaults } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";

  let {
    on_success,
  }: {
    on_success?: () => void;
  } = $props();

  const validators = zod4Client(AuthSchema.change_password_form);
  const form = make_super_form(
    defaults({ new_password: "", current_password: "" }, validators),
    {
      SPA: true,
      validators,
      timeoutMs: 8_000,

      on_success,
      submit: AccountsClient.change_password,
    },
  );
</script>

<form
  class="space-y-4"
  method="POST"
  use:form.enhance
>
  <FormFieldControl
    {form}
    name="current_password"
    label="Current Password"
  >
    {#snippet children({ props })}
      <SuperformInput
        {...props}
        {form}
        type="password"
        autocomplete="current-password"
      />
    {/snippet}
  </FormFieldControl>

  <FormFieldControl
    {form}
    name="new_password"
    label="New Password"
  >
    {#snippet children({ props })}
      <SuperformInput
        {...props}
        {form}
        type="password"
        autocomplete="new-password"
      />
    {/snippet}
  </FormFieldControl>

  <FormButton
    {form}
    class="w-full"
    icon="lucide/lock"
  >
    Change Password
  </FormButton>

  <FormMessage {form} />
</form>
