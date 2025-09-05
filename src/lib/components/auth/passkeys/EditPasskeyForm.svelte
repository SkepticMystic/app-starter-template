<script lang="ts">
  import { PasskeysClient } from "$lib/clients/passkeys.client";
  import FormControl from "$lib/components/form/controls/FormControl.svelte";
  import FormField from "$lib/components/form/fields/FormField.svelte";
  import FormMessage from "$lib/components/form/FormMessage.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { AuthSchema } from "$lib/schema/auth.schema";
  import { make_super_form } from "$lib/utils/form.util";
  import type { Passkey } from "better-auth/plugins/passkey";
  import { defaults } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";

  let {
    // NOTE: Not bindable, we use a local dirty copy instead
    // Then emit updates via on_update
    passkey,
    on_success,
  }: {
    passkey: Passkey;
    // Weird arg shape, just happens to be what BetterAuth returns
    on_success: (data: { passkey: Passkey }) => void;
  } = $props();

  const validators = zod4Client(AuthSchema.Passkey.update);

  // SOURCE: https://superforms.rocks/concepts/spa
  // Main things seem to be SPA, defaults, zod4Client (instead of zod4),
  // and validateForm({ update: true }) to initialize the form with validation
  const form = make_super_form(defaults(passkey, validators), {
    SPA: true,
    validators,
    on_success,
    submit: (data) => PasskeysClient.update(passkey.id, data),
  });
  form.validateForm({ update: true });

  const { form: form_data } = form;
</script>

<form class="flex flex-col gap-2" method="POST" use:form.enhance>
  <FormField {form} name="name">
    <FormControl label="Name">
      {#snippet children({ props })}
        <Input {...props} bind:value={$form_data.name} />
      {/snippet}
    </FormControl>
  </FormField>

  <FormButton {form} icon="heroicons/tag">Update passkey</FormButton>

  <FormMessage message={form.message} />
</form>
