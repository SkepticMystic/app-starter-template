<script lang="ts">
  import { resolve } from "$app/paths";
  import { TaskClient } from "$lib/clients/tasks.client";
  import TaskForm from "$lib/components/form/task/TaskForm.svelte";
  import Anchor from "$lib/components/ui/anchor/Anchor.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import { renderComponent } from "$lib/components/ui/data-table/render-helpers.js";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Modal from "$lib/components/ui/modal/modal.svelte";
  import MultiSelect from "$lib/components/ui/select/MultiSelect.svelte";
  import { TASKS } from "$lib/const/task.const";
  import {
    create_task_remote,
    get_all_tasks_remote,
  } from "$lib/remote/tasks/tasks.remote";
  import {
    CellHelpers,
    TanstackTable,
  } from "$lib/utils/tanstack/table.util.js";
  import { createColumnHelper } from "@tanstack/table-core";
  import { toast } from "svelte-sonner";

  const tasks = get_all_tasks_remote();

  const column =
    createColumnHelper<NonNullable<typeof tasks.current>[number]>();

  const columns = [
    column.accessor("title", {
      meta: { label: "Title" },

      cell: ({ row }) =>
        renderComponent(Anchor, {
          content: row.original.title,
          href: resolve("/tasks/[id]", row),
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

    <Modal
      title="New Task"
      description="Create a new task"
    >
      {#snippet trigger()}
        <Icon icon="lucide/plus" />
        New task
      {/snippet}

      {#snippet content({ close })}
        <TaskForm
          kind="create"
          form={create_task_remote}
          on_success={close}
        />
      {/snippet}
    </Modal>
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
        title: "View task",
        icon: "lucide/eye",
        href: resolve("/tasks/[id]", row),
      },
      {
        title: "Edit task",
        icon: "lucide/pencil",
        href: resolve("/tasks/[id]/edit", row),
      },
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
