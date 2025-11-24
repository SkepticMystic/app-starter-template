<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import TaskForm from "$lib/components/form/task/TaskForm.svelte";
  import { update_task_remote } from "$lib/remote/tasks/tasks.remote.js";

  let { data } = $props();

  const form = update_task_remote;

  form.fields.set(data.task); // only sets initial values, not reactive
  $effect(() => {
    form.fields.set(data.task); // doesn't work on server, reactive
  });
</script>

<article>
  <header>
    <h1>Edit task: {data.task.title}</h1>
  </header>

  <TaskForm
    {form}
    kind="update"
    on_success={() => goto(resolve("/tasks"))}
  />
</article>
