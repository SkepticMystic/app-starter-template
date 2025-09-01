<script lang="ts">
  import Card from "$lib/components/Card.svelte";
  import List from "$lib/components/daisyui/List.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import EditTaskForm from "$lib/components/form/task/EditTaskForm.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { delete_task, get_tasks } from "$lib/remote/tasks.remote.js";
  import { Dates } from "$lib/utils/dates.js";
  import { Items } from "$lib/utils/items.util.js";
  import { toast } from "svelte-sonner";

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
    <List items={tasks}>
      {#snippet row(task)}
        <div>
          <Icon
            icon={task.status === "completed"
              ? "lucide/check"
              : task.status === "in_progress"
                ? "lucide/clock"
                : task.status === "pending"
                  ? "lucide/pause"
                  : "lucide/archive"}
          />
        </div>

        <div class="flex grow flex-col">
          <a href="/tasks/{task.id}">
            {task.title}
          </a>

          <span class="text-sm text-muted-foreground">
            {task.description}
          </span>
        </div>

        <div>
          {Dates.show_date(task.due_date)}
        </div>

        <div>
          <Button
            variant="destructive"
            icon="lucide/x"
            onclick={() => {
              try {
                delete_task(task.id)
                  .updates(
                    tasks_query.withOverride((old) =>
                      Items.remove(old, task.id),
                    ),
                  )
                  .then(() => {
                    toast.success("Task deleted");
                  });
              } catch (error) {
                console.log("Error deleting task", error);
                toast.error("Error deleting task");
              }
            }}
          ></Button>
        </div>
      {/snippet}
    </List>
  {:catch _error}
    <p class="text-warning">Error loading tasks</p>
  {/await}
</div>
