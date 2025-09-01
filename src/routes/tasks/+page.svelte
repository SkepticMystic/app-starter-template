<script lang="ts">
  import Card from "$lib/components/Card.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import EditTaskForm from "$lib/components/form/task/EditTaskForm.svelte";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import { get_tasks } from "$lib/remote/tasks.remote.js";
  import { columns } from "./columns";

  let { data } = $props();

  const tasks_query = get_tasks({});
</script>

<div class="space-y-4">
  <h1>Tasks</h1>

  <Card title="Create Task" description="Create a new task item">
    {#snippet content()}
      <EditTaskForm form_input={data.form_input} />
    {/snippet}
  </Card>

  {#await tasks_query}
    <Loading loading />
  {:then tasks}
    <DataTable
      {columns}
      data={tasks}
      sorting={[{ id: "due_date", desc: true }]}
    />
  {:catch _error}
    <p class="text-warning">Error loading tasks</p>
  {/await}
</div>
