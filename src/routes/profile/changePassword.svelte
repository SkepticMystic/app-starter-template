<script lang="ts">
  import FormControl from "$lib/components/form/FormControl.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import Input from "$lib/components/ui/input/input.svelte";
  import { AuthSchema } from "$lib/schema/auth.schema";
  import { toast } from "svelte-sonner";
  import {
    superForm,
    type Infer,
    type SuperValidated,
  } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";

  let {
    form_input,
  }: {
    form_input: SuperValidated<Infer<typeof AuthSchema.change_password_form>>;
  } = $props();

  const form = superForm(form_input, {
    delayMs: 500,
    timeoutMs: 8_000,
    validators: zod4Client(AuthSchema.change_password_form),

    onUpdated({ form }) {
      if (form.message?.ok && form.message.data) {
        toast.success(form.message.data);
      }
    },
  });

  const { form: form_data, message, enhance, submitting, delayed } = form;
</script>

<form class="space-y-4" method="POST" action="?/change-password" use:enhance>
  <Form.Field {form} name="current_password">
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

    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="new_password">
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

    <Form.FieldErrors />
  </Form.Field>

  <Form.Button
    class="w-full"
    loading={$delayed}
    disabled={$submitting}
    icon="heroicons/lock-closed"
  >
    Change Password
  </Form.Button>

  {#if $message && !$message.ok}
    <p class="text-warning">
      {$message.error}
    </p>
  {/if}
</form>
