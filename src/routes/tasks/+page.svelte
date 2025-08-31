<script lang="ts">
  import Card from "$lib/components/Card.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import EditTaskForm from "$lib/components/form/task/EditTaskForm.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { get_tasks } from "$lib/remote/tasks.remote.js";

  let { data } = $props();
</script>

<h1>Tasks</h1>

{#await get_tasks({})}
  <Loading loading />
{:then tasks}
  <ul>
    {#each tasks as { status, title, id } (id)}
      <li class="flex items-baseline gap-2">
        <Button variant="link" href="/tasks/{id}">{title}</Button>

        <span>{status}</span>
      </li>
    {/each}
  </ul>
{:catch _error}
  <p class="text-warning">Error loading tasks</p>
{/await}

<Card title="Create Task" description="Create a new task item">
  {#snippet content()}
    <EditTaskForm form_input={data.form_input} />
  {/snippet}
</Card>
