<script lang="ts">
  import FormErrors from "$lib/components/form/FormErrors.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import Textarea from "$lib/components/ui/textarea/textarea.svelte";
  import { TASKS } from "$lib/const/task.const";
  import type { MaybePromise } from "$lib/interfaces";
  import {
    create_task_remote,
    update_task_remote,
  } from "$lib/remote/tasks/tasks.remote";
  import type { Task, TaskSchema } from "$lib/server/db/models/task.model";
  import { FormUtil } from "$lib/utils/form/form.util.svelte";
  import { toast } from "svelte-sonner";
  import FormButton from "../FormButton.svelte";

  let props: (
    | {
        mode: "create";
        initial?: TaskSchema["insert"];
      }
    | {
        mode: "update";
        initial: TaskSchema["update"];
      }
  ) & {
    on_success?: (d: Task) => MaybePromise<unknown>;
  } = $props();

  if (props.mode === "update") {
    FormUtil.init(update_task_remote, () => props.initial);
  } else if (props.initial) {
    FormUtil.init(create_task_remote, () => props.initial);
  }

  const form =
    props.mode === "create" ? create_task_remote : update_task_remote;
</script>

<form
  class="space-y-3"
  {...form.enhance(async ({ submit }) => {
    await submit();

    FormUtil.count_issue_metrics(form, "task_form");

    const res = form.result;
    if (res?.ok) {
      toast.success(props.mode === "create" ? "Task created" : "Task updated");

      await props.on_success?.(res.data);
    } else if (res?.error) {
      toast.error(res.error.message);
    }
  })}
>
  {#if props.mode === "update"}
    <input
      {...update_task_remote.fields.id.as(
        "hidden",
        update_task_remote.fields.id.value(),
      )}
    />
  {/if}

  <Field
    label="Title"
    field={form.fields.title}
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
      field={form.fields.status}
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
      field={form.fields.due_date}
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
    field={form.fields.description}
  >
    {#snippet input({ props, field })}
      <Textarea
        {...props}
        {...field?.as("text")}
        placeholder="Task description"
      />
    {/snippet}
  </Field>

  <FormButton
    {form}
    class="w-full"
    icon="lucide/check"
  >
    Save task
  </FormButton>

  <FormErrors {form} />
</form>
