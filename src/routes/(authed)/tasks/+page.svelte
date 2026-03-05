<script lang="ts">
  import { resolve } from "$app/paths";
  import { TaskClient } from "$lib/clients/tasks.client";
  import TaskForm from "$lib/components/form/task/TaskForm.svelte";
  import Anchor from "$lib/components/ui/anchor/Anchor.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import { renderComponent } from "$lib/components/ui/data-table/render-helpers.js";
  import Input from "$lib/components/ui/input/input.svelte";
  import MultiSelect from "$lib/components/ui/select/MultiSelect.svelte";
  import Sheet from "$lib/components/ui/sheet/Sheet.svelte";
  import { TASKS } from "$lib/const/task.const";
  import { get_all_tasks_remote } from "$lib/remote/tasks/tasks.remote";
  import {
    CellHelpers,
    TanstackTable,
  } from "$lib/utils/tanstack/table.util.js";
  import { createColumnHelper } from "@tanstack/table-core";

  const tasks = get_all_tasks_remote();

  const column =
    createColumnHelper<NonNullable<typeof tasks.current>[number]>();

  const columns = [
    column.accessor("title", {
      meta: { label: "Title" },

      cell: ({ row }) =>
        renderComponent(Anchor, {
          content: row.original.title,
          href: resolve("/(authed)/tasks/[id]", row),
        }),
    }),

    column.accessor("status", {
      meta: { label: "Status" },
      filterFn: "arrIncludesSome",

      cell: (c) => CellHelpers.label(c, TASKS.STATUS.MAP),
    }),

    column.accessor("due_date", {
      meta: { label: "Due date" },

      filterFn: TanstackTable.filter_fns.date_range,

      cell: (c) => CellHelpers.time(c, { show: "datetime" }),
    }),

    column.accessor("createdAt", {
      meta: { label: "Created" },

      cell: CellHelpers.time,
    }),
  ];
</script>

<article>
  <header class="flex items-center justify-between">
    <h1>Tasks</h1>

    <Sheet
      icon="lucide/plus"
      title="New Task"
      description="Create a new task"
    >
      {#snippet children({ close })}
        <TaskForm
          mode="create"
          on_success={close}
        />
      {/snippet}
    </Sheet>
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
        title: "Edit task",
        icon: "lucide/pencil",
        href: resolve("/(authed)/tasks/[id]/edit", row),
      },

      {
        title: "Delete task",
        icon: "lucide/trash-2",
        variant: "destructive",
        onselect: () => TaskClient.delete(row.id),
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
