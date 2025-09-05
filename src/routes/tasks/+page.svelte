<script lang="ts">
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import EditTaskForm from "$lib/components/form/task/EditTaskForm.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import DateRangePicker from "$lib/components/ui/date-picker/DateRangePicker.svelte";
  import Dialog from "$lib/components/ui/dialog/dialog.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import MultiSelect from "$lib/components/ui/select/MultiSelect.svelte";
  import { TASKS } from "$lib/const/task.const";
  import { get_tasks } from "$lib/remote/tasks.remote.js";
  import type { DateRange } from "bits-ui";
  import { columns } from "./columns";

  let { data } = $props();

  const tasks_query = get_tasks({});
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h1>Tasks</h1>

    <Dialog title="New Task" description="Create a new task">
      {#snippet trigger()}
        <Icon icon="lucide/plus" />
        New task
      {/snippet}

      {#snippet content({ close })}
        <EditTaskForm form_input={data.form_input} on_success={() => close()} />
      {/snippet}
    </Dialog>
  </div>

  {#await tasks_query}
    <Loading loading title="Fetching tasks..." />
  {:then tasks}
    <DataTable
      {columns}
      data={tasks}
      states={{ sorting: [{ id: "createdAt", desc: true }] }}
    >
      {#snippet filters(table)}
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
    <p class="text-warning" {@attach () => console.error(error)}>
      Error loading tasks
    </p>
  {/await}
</div>
