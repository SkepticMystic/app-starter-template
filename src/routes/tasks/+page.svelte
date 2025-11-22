<script lang="ts">
  import { Client } from "$lib/clients/index.client";
  import EditTaskForm from "$lib/components/form/task/EditTaskForm.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import DateRangePicker from "$lib/components/ui/date-picker/DateRangePicker.svelte";
  import Dialog from "$lib/components/ui/dialog/dialog.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Loading from "$lib/components/ui/loading/Loading.svelte";
  import MultiSelect from "$lib/components/ui/select/MultiSelect.svelte";
  import { TASKS } from "$lib/const/task.const";
  import { delete_task, get_tasks } from "$lib/remote/tasks/tasks.remote.js";
  import { Items } from "$lib/utils/items.util";
  import { DateRange } from "bits-ui";
  import { columns } from "./columns";

  let { data } = $props();

  const tasks_query = get_tasks({});
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h1>Tasks</h1>

    <Dialog
      title="New Task"
      description="Create a new task"
    >
      {#snippet trigger()}
        <Icon icon="lucide/plus" />
        New task
      {/snippet}

      {#snippet content({ close })}
        <EditTaskForm
          form_input={data.form_input}
          on_success={() => close()}
        />
      {/snippet}
    </Dialog>
  </div>

  {#await tasks_query}
    <Loading
      loading
      title="Fetching tasks..."
    />
  {:then tasks}
    <DataTable
      {columns}
      data={tasks}
      states={{
        sorting: [{ id: "createdAt", desc: true }],
      }}
      actions={(row) => [
        {
          title: "Copy task ID",
          icon: "lucide/copy",

          onselect: () => navigator.clipboard.writeText(row.id),
        },
        {
          title: "Delete task",
          icon: "lucide/trash-2",
          onselect: () =>
            Client.request(
              () =>
                delete_task(row.id).updates(
                  get_tasks({}).withOverride((old) =>
                    Items.remove(old, row.id),
                  ),
                ),
              { toast: { optimistic: true, success: "Task deleted" } },
            ),
        },
      ]}
    >
      {#snippet header(table)}
        <div class="flex gap-1.5">
          <Input
            class="max-w-sm"
            placeholder="Filter by title"
            bind:value={
              () => table.getColumn("title")?.getFilterValue() ?? "",
              (value) => table.getColumn("title")?.setFilterValue(value)
            }
          />

          <MultiSelect
            options={TASKS.STATUS.OPTIONS}
            placeholder="Filter by status"
            bind:value={
              () =>
                (table.getColumn("status")?.getFilterValue() ?? []) as string[],
              (value) => table.getColumn("status")?.setFilterValue(value)
            }
          />

          <DateRangePicker
            placeholder="Filter by due date"
            bind:value={
              () =>
                table.getColumn("due_date")?.getFilterValue() as
                  | DateRange
                  | undefined,
              (value) => table.getColumn("due_date")?.setFilterValue(value)
            }
          />

          {#if table.getState().columnFilters.length}
            <Button
              icon="lucide/x"
              variant="ghost"
              onclick={() => table.resetColumnFilters()}
            >
              Clear
            </Button>
          {/if}
        </div>
      {/snippet}
    </DataTable>
  {:catch error}
    <p
      class="text-warning"
      {@attach () => console.error(error)}
    >
      Error loading tasks
    </p>
  {/await}
</div>
