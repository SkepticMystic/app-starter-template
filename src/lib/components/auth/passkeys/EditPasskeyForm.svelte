<script lang="ts">
  import { PasskeysClient } from "$lib/clients/passkeys.client";
  import FormFieldControl from "$lib/components/form/fields/FormFieldControl.svelte";
  import FormMessage from "$lib/components/form/FormMessage.svelte";
  import SuperformInput from "$lib/components/form/inputs/SuperformInput.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
  import { AuthSchema } from "$lib/schema/auth.schema";
  import type { Passkey } from "$lib/server/db/schema/auth.models";
  import { make_super_form } from "$lib/utils/form.util";
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
</script>

<form
  class="flex flex-col gap-2"
  method="POST"
  use:form.enhance
>
  <FormFieldControl
    {form}
    name="name"
    label="Name"
  >
    {#snippet children({ props })}
      <SuperformInput
        {...props}
        {form}
      />
    {/snippet}
  </FormFieldControl>

  <FormButton
    {form}
    icon="lucide/tag">Update passkey</FormButton
  >

  <FormMessage {form} />
</form>
