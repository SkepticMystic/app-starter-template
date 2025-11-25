<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import Textarea from "$lib/components/ui/textarea/textarea.svelte";
  import { TASKS } from "$lib/const/task.const";
  import type { MaybePromise } from "$lib/interfaces";
  import type {
    create_task_remote,
    update_task_remote,
  } from "$lib/remote/tasks/tasks.remote";
  import { toast } from "svelte-sonner";

  let props: (
    | {
        kind: "create";
        form: typeof create_task_remote;
      }
    | {
        kind: "update";
        form: typeof update_task_remote;
      }
  ) & {
    on_success?: () => MaybePromise<unknown>;
  } = $props();

  if (props.kind === "create") {
    props.form.fields.status.set("pending");
  }
</script>

<form
  class="space-y-3"
  {...props.form.enhance(async ({ submit }) => {
    await submit();

    const res = props.form.result;
    if (res?.ok) {
      toast.success("Task updated");

      await props.on_success?.();
    } else if (res?.error) {
      toast.error(res.error.message);
    }
  })}
>
  <!-- NOTE: This only works if I've already set the id outside
 But if I've done that already, do I still need this hidden input?
 Turns out, yes, you do -->
  {#if props.kind === "update"}
    <input
      {...props.form.fields.id.as("hidden", props.form.fields.id.value())}
    />
  {/if}

  <Field
    label="Title"
    field={props.form.fields.title}
  >
    {#snippet input({ props, field })}
      <Input
        {...props}
        {...field?.as("text")}
        required
        class="w-full"
        placeholder="Task title"
      />
    {/snippet}
  </Field>

  <div class="flex gap-x-2">
    <Field
      label="Status"
      class="grow"
      field={props.form.fields.status}
    >
      {#snippet input({ props, field })}
        <NativeSelect
          {...props}
          {...field?.as("select")}
          required
          class="w-full"
          placeholder="Select status"
          options={TASKS.STATUS.OPTIONS}
        />
      {/snippet}
    </Field>

    <Field
      label="Due Date"
      class="grow"
      field={props.form.fields.due_date}
    >
      {#snippet input({ props, field })}
        <Input
          {...props}
          {...field?.as("datetime-local")}
          class="w-full"
        />
      {/snippet}
    </Field>
  </div>

  <Field
    label="Description"
    field={props.form.fields.description}
  >
    {#snippet input({ props, field })}
      <Textarea
        {...props}
        {...field?.as("text")}
        placeholder="Task description"
      />
    {/snippet}
  </Field>

  <Button
    type="submit"
    class="w-full"
    icon="lucide/check"
    loading={props.form.pending > 0}
  >
    Save task
  </Button>
</form>
