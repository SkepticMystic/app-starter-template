<script lang="ts">
  import { TaskClient } from "$lib/clients/tasks.client";
  import DatePicker from "$lib/components/ui/date-picker/DatePicker.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
  import SingleSelect from "$lib/components/ui/select/SingleSelect.svelte";
  import Textarea from "$lib/components/ui/textarea/textarea.svelte";
  import { TASKS } from "$lib/const/task.const";
  import { TaskSchema } from "$lib/schema/task.schema";
  import type { Task } from "$lib/server/db/schema/task.models";
  import { make_super_form } from "$lib/utils/form.util";
  import { type Infer, type SuperValidated } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import FormFieldControl from "../fields/FormFieldControl.svelte";
  import FormMessage from "../FormMessage.svelte";
  import SuperformInput from "../inputs/SuperformInput.svelte";

  let {
    form_input,
    on_success,
  }: {
    on_success?: (task: Task) => void;
    form_input: SuperValidated<Infer<typeof TaskSchema.create>>;
  } = $props();

  const form = make_super_form(form_input, {
    timeoutMs: 8_000,
    // NOTE: Seems to be the only way to prevent form data from being cleared,
    // even on failure
    applyAction: "never",
    validators: zod4Client(TaskSchema.create),

    on_success,
    submit: TaskClient.create,
  });

  const { form: form_data } = form;
</script>

<form class="flex flex-col gap-2" method="POST" use:form.enhance>
  <FormFieldControl {form} name="title" label="Title">
    {#snippet children({ props })}
      <SuperformInput {...props} {form} placeholder="Task title" />
    {/snippet}
  </FormFieldControl>

  <div class="flex gap-x-2">
    <FormFieldControl {form} name="status" label="Status" class="grow">
      {#snippet children({ props })}
        <SingleSelect
          {...props}
          required
          class="w-full"
          placeholder="Select status"
          options={TASKS.STATUS.OPTIONS}
          bind:value={$form_data.status}
        />
      {/snippet}
    </FormFieldControl>

    <FormFieldControl {form} name="due_date" label="Due Date" class="grow">
      {#snippet children({ props })}
        <DatePicker
          {...props}
          class="w-full"
          bind:value={$form_data.due_date}
        />
      {/snippet}
    </FormFieldControl>
  </div>

  <FormFieldControl {form} name="description" label="Description">
    {#snippet children({ props })}
      <Textarea
        {...props}
        placeholder="Task description"
        bind:value={$form_data.description}
      />
    {/snippet}
  </FormFieldControl>

  <FormButton {form} class="w-full" icon="lucide/plus">Create Task</FormButton>

  <FormMessage {form} />
</form>
