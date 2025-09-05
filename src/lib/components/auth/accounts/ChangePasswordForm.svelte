<script lang="ts">
  import { AccountsClient } from "$lib/clients/accounts.client";
  import FormControl from "$lib/components/form/controls/FormControl.svelte";
  import FormField from "$lib/components/form/fields/FormField.svelte";
  import FormMessage from "$lib/components/form/FormMessage.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
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

  const { form: form_data } = form;
</script>

<form class="space-y-4" method="POST" use:form.enhance>
  <FormField {form} name="current_password">
    <FormControl label="Current Password">
      {#snippet children({ props })}
        <Input
          {...props}
          required
          type="password"
          autocomplete="current-password"
          bind:value={$form_data.current_password}
        />
      {/snippet}
    </FormControl>
  </FormField>

  <FormField {form} name="new_password">
    <FormControl label="New Password">
      {#snippet children({ props })}
        <Input
          {...props}
          required
          type="password"
          autocomplete="new-password"
          bind:value={$form_data.new_password}
        />
      {/snippet}
    </FormControl>
  </FormField>

  <FormButton {form} class="w-full" icon="heroicons/lock-closed">
    Change Password
  </FormButton>

  <FormMessage message={form.message} />
</form>
