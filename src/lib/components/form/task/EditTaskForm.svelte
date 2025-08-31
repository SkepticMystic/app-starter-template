<script lang="ts">
  import FormControl from "$lib/components/form/FormControl.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import Input from "$lib/components/ui/input/input.svelte";
  import { TaskSchema } from "$lib/schema/task.schema";
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
    form_input: SuperValidated<Infer<typeof TaskSchema.create>>;
  } = $props();

  const form = superForm(form_input, {
    delayMs: 500,
    timeoutMs: 8_000,
    validators: zod4Client(TaskSchema.create),

    onResult: ({ result }) => {
      if (result.type === "redirect") {
        location.href = result.location;
      } else if (result.type === "success") {
        toast.success("Task created");
      }
    },
  });

  const { form: form_data, message, enhance, submitting, delayed } = form;
</script>

<form class="space-y-4" method="POST" action="?/create-task" use:enhance>
  <Form.Field {form} name="title">
    <FormControl label="Title">
      {#snippet children({ props })}
        <Input {...props} required bind:value={$form_data.title} />
      {/snippet}
    </FormControl>

    <Form.FieldErrors />
  </Form.Field>

  <Form.Button
    class="w-full"
    loading={$delayed}
    icon="lucide/plus"
    disabled={$submitting}
  >
    Create Task
  </Form.Button>

  {#if $message && !$message.ok}
    <p class="text-warning">{$message.error}</p>
  {/if}
</form>
