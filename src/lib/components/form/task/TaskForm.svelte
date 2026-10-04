<!-- svelte-ignore state_referenced_locally -->
<script lang="ts">
  import FormErrors from "#lib/components/form/FormErrors.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import NativeSelect from "#lib/components/ui/native-select/native-select.svelte";
  import Textarea from "#lib/components/ui/textarea/textarea.svelte";
  import { TASKS } from "#lib/const/task.const.js";
  import type { MaybePromise } from "#lib/interfaces/index.js";
  import {
    create_task_remote,
    update_task_remote,
  } from "#lib/remote/tasks/tasks.remote.js";
  import type { Task, TaskSchema } from "#lib/server/db/models/task.model.js";
  import { FormUtil } from "#lib/utils/form/form.util.svelte.js";
  import FormActions from "../FormActions.svelte";
  import FormButton from "../FormButton.svelte";

  let props: (
    | {
        mode: "create";
        initial: TaskSchema["insert"];
      }
    | {
        mode: "update";
        initial: TaskSchema["update"];
      }
  ) & {
    on_success?: (d: Task) => MaybePromise<unknown>;
    /** Where Cancel goes. None in a sheet, which closes itself. */
    cancel_href?: string;
  } = $props();

  if (props.mode === "update") {
    FormUtil.init(update_task_remote, () => props.initial);
  } else {
    FormUtil.init(create_task_remote, () => props.initial);
  }

  const form =
    props.mode === "create" ? create_task_remote : update_task_remote;
</script>

<form
  class="space-y-3"
  {...FormUtil.enhance(form, {
    metric: "task_form",
    suc_msg: props.mode === "create" ? "Task created" : "Task updated",
    on_success: (task) => props.on_success?.(task),
  })}
>
  {#if props.mode === "update"}
    <input
      {...update_task_remote.fields.id.as(
        "hidden",
        update_task_remote.fields.id.value() ?? "",
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
        maxlength={255}
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
      label="Due date"
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
        maxlength={5000}
        placeholder="Task description"
      />
    {/snippet}
  </Field>

  <FormErrors {form} />

  <FormActions cancel_href={props.cancel_href}>
    <FormButton {form}>
      {props.mode === "create" ? "Create task" : "Save changes"}
    </FormButton>
  </FormActions>
</form>
