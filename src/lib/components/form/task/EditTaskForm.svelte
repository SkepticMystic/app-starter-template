<script lang="ts">
  import DatePicker from "$lib/components/ui/date-picker/DatePicker.svelte";
  import * as Form from "$lib/components/ui/form/index";
  import Input from "$lib/components/ui/input/input.svelte";
  import SingleSelect from "$lib/components/ui/select/SingleSelect.svelte";
  import Textarea from "$lib/components/ui/textarea/textarea.svelte";
  import { TASKS } from "$lib/const/task.const";
  import { create_task, get_tasks } from "$lib/remote/tasks.remote";
  import { TaskSchema } from "$lib/schema/task.schema";
  import { make_super_form } from "$lib/utils/form.util";
  import { Items } from "$lib/utils/items.util";
  import { type Infer, type SuperValidated } from "sveltekit-superforms";
  import FormControl from "../FormControl.svelte";

  let {
    form_input,
  }: {
    form_input: SuperValidated<Infer<typeof TaskSchema.create>>;
  } = $props();

  const form = make_super_form(form_input, TaskSchema.create, {
    delayMs: 500,
    timeoutMs: 8_000,
    remote: (task) =>
      create_task(task).updates(
        get_tasks({}).withOverride((tasks) =>
          Items.add(tasks, { ...task, createdAt: new Date() }, { front: true }),
        ),
      ),

    // NOTE: Seems to be the only way to prevent form data from being cleared,
    // even on failure
    applyAction: "never",
  });

  const { form: form_data, message, enhance, pending } = form;
</script>

<form class="flex flex-col gap-2" method="POST" use:enhance>
  <Form.Field {form} name="title">
    <FormControl label="Title">
      {#snippet children({ props })}
        <Input
          {...props}
          required
          placeholder="Task title"
          bind:value={$form_data.title}
        />
      {/snippet}
    </FormControl>

    <Form.FieldErrors />
  </Form.Field>

  <div class="flex gap-x-2">
    <Form.Field {form} name="status" class="grow">
      <FormControl label="Status">
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
      </FormControl>

      <Form.FieldErrors />
    </Form.Field>

    <Form.Field {form} name="due_date" class="grow">
      <FormControl label="Due Date">
        {#snippet children({ props })}
          <DatePicker
            {...props}
            class="w-full"
            bind:value={$form_data.due_date}
          />
        {/snippet}
      </FormControl>

      <Form.FieldErrors />
    </Form.Field>
  </div>

  <Form.Field {form} name="description">
    <FormControl label="Description">
      {#snippet children({ props })}
        <Textarea
          {...props}
          placeholder="Task description"
          bind:value={$form_data.description}
        />
      {/snippet}
    </FormControl>

    <Form.FieldErrors />
  </Form.Field>

  <Form.Button class="w-full" icon="lucide/plus" loading={$pending}>
    Create Task
  </Form.Button>

  {#if $message && !$message.ok && $message.error}
    <p class="text-warning">{$message.error}</p>
  {/if}
</form>
