<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import TaskForm from "$lib/components/form/task/TaskForm.svelte";
  import { Dates } from "$lib/utils/dates.js";

  let { data } = $props();
</script>

<article>
  <header>
    <h1>Edit task: {data.task.title}</h1>
  </header>

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
    on_success={() => goto(resolve("/tasks"))}
  />
</article>
