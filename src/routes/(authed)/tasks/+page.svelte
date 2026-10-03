<script lang="ts">
  import { resolve } from "$app/paths";
  import Header from "#lib/components/ui/header/Header.svelte";
  import { Client } from "#lib/clients/index.client.js";
  import { TaskClient } from "#lib/clients/tasks.client.js";
  import TaskForm from "#lib/components/form/task/TaskForm.svelte";
  import DataTable from "#lib/components/ui/data-table/data-table.svelte";
  import Sheet from "#lib/components/ui/sheet/Sheet.svelte";
  import { TASKS } from "#lib/const/task.const.js";
  import { get_all_tasks_remote } from "#lib/remote/tasks/tasks.remote.js";
  import { Arrays } from "#lib/utils/array/array.util.js";
  import {
    CellHelpers,
    column_helper,
    TanstackTable,
  } from "#lib/utils/tanstack/table.util.js";

  let tasks = $derived(
    await Client.wrap(get_all_tasks_remote)().then((r) => (r.ok ? r.data : [])),
  );

  const column = column_helper<NonNullable<typeof tasks>[number]>();

  const columns = [
    column.accessor("title", {
      meta: { label: "Title" },
    }),

    column.accessor("status", {
      meta: { label: "Status" },
      filterFn: "arrHas",

      cell: (c) => CellHelpers.badge(c, TASKS.STATUS.MAP),
    }),

    column.accessor("due_date", {
      meta: { label: "Due date" },

      filterFn: "date_range",

      cell: (c) => CellHelpers.time(c, { show: "datetime" }),
    }),

    column.accessor("createdAt", {
      meta: { label: "Created" },

      cell: CellHelpers.time,
    }),
  ];
</script>

<article>
  <Header title="Tasks">
    {#snippet actions()}
      <Sheet
        icon="lucide/plus"
        title="New task"
        description="Create a new task"
      >
        {#snippet children({ close })}
          <TaskForm
            mode="create"
            initial={{
              title: "",
              description: "",
              status: "pending",
              due_date: undefined,
              assigned_member_id: undefined,
            }}
            on_success={close}
          />
        {/snippet}
      </Sheet>
    {/snippet}
  </Header>

  <DataTable
    {columns}
    noun="task"
    filters={[
      { kind: "search", id: "title", placeholder: "Title" },
      {
        kind: "multi",
        id: "status",
        placeholder: "Status",
        options: TASKS.STATUS.OPTIONS,
      },
      { kind: "date_range", id: "due_date", placeholder: "Due date" },
    ]}
    data={tasks}
    href={(row) => resolve("/(authed)/tasks/[id]", row)}
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
        onselect: () =>
          TaskClient.delete(row.id, {
            on_success: () => (tasks = Arrays.remove(tasks, row.id)),
          }),
      },
    ]}
  ></DataTable>
</article>
