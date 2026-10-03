<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import Header from "#lib/components/ui/header/Header.svelte";
  import TaskForm from "#lib/components/form/task/TaskForm.svelte";
  import { Dates } from "#lib/utils/dates.js";

  let { data } = $props();
</script>

<article>
  <Header
    title="Edit task"
    head_title={`Edit ${data.task.title}`}
    back={[
      { href: resolve("/(authed)/tasks"), label: "Tasks" },
      {
        href: resolve("/(authed)/tasks/[id]", data.task),
        label: data.task.title,
      },
    ]}
  />

  <TaskForm
    mode="update"
    initial={{
      id: data.task.id,
      title: data.task.title,
      status: data.task.status,
      description: data.task.description ?? "",
      assigned_member_id: data.task.assigned_member_id ?? undefined,
      due_date: data.task.due_date
        ? Dates.to_datetime_local_string(data.task.due_date)
        : "",
    }}
    on_success={() => goto(resolve("tasks"))}
  />
</article>
