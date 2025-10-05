<script lang="ts">
  import FormFieldControl from "$lib/components/form/fields/FormFieldControl.svelte";
  import FormMessage from "$lib/components/form/FormMessage.svelte";
  import SuperformInput from "$lib/components/form/inputs/SuperformInput.svelte";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
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

  const { form: form_data } = form;
</script>

<form class="space-y-4" method="POST" use:form.enhance>
  <FormFieldControl {form} name="name" label="Name">
    {#snippet children({ props })}
      <SuperformInput {...props} {form} autocomplete="name" />
    {/snippet}
  </FormFieldControl>

  <FormFieldControl {form} name="email" label="Email">
    {#snippet children({ props })}
      <SuperformInput {...props} {form} type="email" autocomplete="email" />
    {/snippet}
  </FormFieldControl>

  <FormFieldControl {form} name="password" label="Password">
    {#snippet children({ props })}
      <SuperformInput
        {...props}
        {form}
        type="password"
        autocomplete="new-password"
      />
    {/snippet}
  </FormFieldControl>

  <FormFieldControl {form} name="remember" horizontal label="Remember me">
    {#snippet children({ props })}
      <Checkbox {...props} bind:checked={$form_data.remember} />
    {/snippet}
  </FormFieldControl>

  <FormButton {form} class="w-full" icon={provider.icon}>
    Signup with {provider.name}
  </FormButton>

  <FormMessage {form} />
</form>
