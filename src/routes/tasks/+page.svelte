<script lang="ts">
  import { Client } from "$lib/clients/index.client";
  import EditTaskForm from "$lib/components/form/task/EditTaskForm.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import DateRangePicker from "$lib/components/ui/date-picker/DateRangePicker.svelte";
  import Dialog from "$lib/components/ui/dialog/dialog.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import MultiSelect from "$lib/components/ui/select/MultiSelect.svelte";
  import { TASKS } from "$lib/const/task.const";
  import {
    delete_task,
    get_all_tasks_remote,
  } from "$lib/remote/tasks/tasks.remote.js";
  import { Items } from "$lib/utils/items.util";
  import type { DateRange } from "bits-ui";
  import { toast } from "svelte-sonner";
  import { columns } from "./columns";

  let { data } = $props();

  const tasks = get_all_tasks_remote();
</script>

<article>
  <header class="flex items-center justify-between">
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
  </header>

  <DataTable
    {columns}
    loading={tasks.loading}
    data={tasks.current ?? []}
    states={{
      sorting: [{ id: "createdAt", desc: true }],
    }}
    actions={(row) => [
      {
        title: "Copy task ID",
        icon: "lucide/copy",

        onselect: () =>
          navigator.clipboard
            .writeText(row.id)
            .then(() => toast.success("Copied task ID"))
            .catch(() => toast.error("Failed to copy task ID")),
      },
      {
        title: "Delete task",
        icon: "lucide/trash-2",
        variant: "destructive",
        onselect: () =>
          Client.request(
            () =>
              delete_task(row.id).updates(
                get_all_tasks_remote().withOverride((old) =>
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
          placeholder="Title"
          bind:value={
            () => table.getColumn("title")?.getFilterValue() ?? "",
            (value) => table.getColumn("title")?.setFilterValue(value)
          }
        />

        <MultiSelect
          options={TASKS.STATUS.OPTIONS}
          placeholder="Status"
          bind:value={
            () =>
              (table.getColumn("status")?.getFilterValue() ?? []) as string[],
            (value) => table.getColumn("status")?.setFilterValue(value)
          }
        />

        <DateRangePicker
          placeholder="Due date"
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
</article>
