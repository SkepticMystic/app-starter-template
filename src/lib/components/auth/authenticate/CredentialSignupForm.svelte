<script lang="ts">
  import FormControl from "$lib/components/form/controls/FormControl.svelte";
  import EmailFormField from "$lib/components/form/fields/EmailFormField.svelte";
  import FormField from "$lib/components/form/fields/FormField.svelte";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { AuthSchema } from "$lib/schema/auth.schema";
  import {
    superForm,
    type Infer,
    type SuperValidated,
  } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";

  let {
    form_input,
  }: {
    form_input: SuperValidated<Infer<typeof AuthSchema.signup_form>>;
  } = $props();

  const provider_id = "credential" satisfies IAuth.ProviderId;
  const provider = AUTH.PROVIDERS.MAP[provider_id];

  const form = superForm(form_input, {
    delayMs: 500,
    timeoutMs: 8_000,
    validators: zod4Client(AuthSchema.signin_form),

    onResult: ({ result }) => {
      if (result.type === "redirect") {
        location.href = result.location;
      }
    },
  });

  const { form: form_data, enhance, message } = form;
</script>

<form class="space-y-4" method="POST" use:enhance>
  <FormField {form} name="name">
    <FormControl label="Name">
      {#snippet children({ props })}
        <Input
          {...props}
          required
          type="text"
          autocomplete="name"
          bind:value={$form_data.name}
        />
      {/snippet}
    </FormControl>
  </FormField>

  <EmailFormField {form} bind:value={$form_data.email} />

  <FormField {form} name="password">
    <FormControl label="Password">
      {#snippet children({ props })}
        <Input
          {...props}
          type="password"
          autocomplete="new-password"
          bind:value={$form_data.password}
        />
      {/snippet}
    </FormControl>
  </FormField>

  <FormField {form} name="remember">
    <FormControl horizontal label="Remember me">
      {#snippet children({ props })}
        <Checkbox {...props} bind:checked={$form_data.remember} />
      {/snippet}
    </FormControl>
  </FormField>

  <FormButton {form} class="w-full" icon={provider.icon}>
    Signup with {provider.name}
  </FormButton>

  {#if $message && !$message.ok}
    <p class="text-warning">{$message.error}</p>
  {/if}
</form>
