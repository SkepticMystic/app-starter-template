<script lang="ts">
  import FormControl from "$lib/components/form/FormControl.svelte";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import Input from "$lib/components/ui/input/input.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const.js";
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
    form_input: SuperValidated<Infer<typeof AuthSchema.signin_form>>;
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

  const { form: form_data, message, enhance, submitting, delayed } = form;
</script>

<form class="space-y-4" method="POST" use:enhance>
  <Form.Field {form} name="email">
    <FormControl label="Email">
      {#snippet children({ props })}
        <Input
          {...props}
          required
          type="email"
          autocomplete="email"
          bind:value={$form_data.email}
        />
      {/snippet}
    </FormControl>

    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="password">
    <FormControl label="Password">
      {#snippet children({ props })}
        <Input
          {...props}
          required
          type="password"
          autocomplete="current-password"
          bind:value={$form_data.password}
        />
      {/snippet}
    </FormControl>

    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="remember">
    <FormControl horizontal label="Remember me">
      {#snippet children({ props })}
        <Checkbox {...props} bind:checked={$form_data.remember} />
      {/snippet}
    </FormControl>

    <Form.FieldErrors />
  </Form.Field>

  <Form.Button
    class="w-full"
    loading={$delayed}
    icon={provider.icon}
    disabled={$submitting}
  >
    Signin with {provider.name}
  </Form.Button>

  {#if $message && !$message.ok}
    <p class="text-warning">{$message.error}</p>
  {/if}
</form>
