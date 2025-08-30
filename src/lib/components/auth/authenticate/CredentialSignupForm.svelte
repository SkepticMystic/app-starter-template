<script lang="ts">
  import { page } from "$app/state";
  import FormControl from "$lib/components/form/FormControl.svelte";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
  import FormFieldErrors from "$lib/components/ui/form/form-field-errors.svelte";
  import FormField from "$lib/components/ui/form/form-field.svelte";
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
    validators: zod4Client(AuthSchema.signin_form),

    delayMs: 500,
    timeoutMs: 8_000,

    onResult: ({ result }) => {
      if (result.type === "redirect") {
        location.href = result.location;
      }
    },
  });

  const { form: form_data, enhance, submitting, delayed } = form;
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

    <FormFieldErrors />
  </FormField>

  <FormField {form} name="email">
    <FormControl label="Email">
      {#snippet children({ props })}
        <Input
          required
          {...props}
          type="email"
          autocomplete="email"
          bind:value={$form_data.email}
        />
      {/snippet}
    </FormControl>

    <FormFieldErrors />
  </FormField>

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

    <FormFieldErrors />
  </FormField>

  <FormField {form} name="remember">
    <FormControl horizontal label="Remember me">
      {#snippet children({ props })}
        <Checkbox {...props} bind:checked={$form_data.remember} />
      {/snippet}
    </FormControl>

    <FormFieldErrors />
  </FormField>

  <FormButton
    class="w-full"
    loading={$delayed}
    icon={provider.icon}
    disabled={$submitting}
  >
    Signup with {provider.name}
  </FormButton>

  {#if page.form?.message}
    <p class="text-warning">{page.form?.message}</p>
  {/if}
</form>
