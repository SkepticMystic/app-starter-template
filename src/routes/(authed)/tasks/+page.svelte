<script lang="ts">
  import { goto, invalidate } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import Header from "#lib/components/ui/header/Header.svelte";
  import { TaskClient } from "#lib/clients/tasks.client.js";
  import TaskForm from "#lib/components/form/task/TaskForm.svelte";
  import DataTable from "#lib/components/ui/data-table/data-table.svelte";
  import Sheet from "#lib/components/ui/sheet/Sheet.svelte";
  import { TASKS } from "#lib/const/task.const.js";
  import {
    CellHelpers,
    column_helper,
  } from "#lib/utils/tanstack/table.util.js";
  import { Url } from "#lib/utils/urls.js";

  let { data } = $props();

  const reload = () => invalidate("app:tasks");

  // A mutable copy: `page.url.searchParams` is read-only in kit 3.
  const params = $derived(new URLSearchParams(page.url.search));

  const column = column_helper<(typeof data.tasks)[number]>();

  // No `filterFn`s or sort seed: the load filters, sorts and pages, and server
  // mode switches both off on the table.
  const columns = [
    column.accessor("title", {
      meta: { label: "Title" },
    }),

    column.accessor("status", {
      meta: { label: "Status" },

      cell: (c) => CellHelpers.badge(c, TASKS.STATUS.MAP),
    }),

    column.accessor("due_date", {
      meta: { label: "Due date" },

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
            on_success={async () => {
              close();
              await reload();
            }}
          />
        {/snippet}
      </Sheet>
    {/snippet}
  </Header>

  <DataTable
    {columns}
    noun="task"
    data={data.tasks}
    server={{
      total: data.total,
      offset: data.offset,
      limit: data.limit,
      params,
      on_change: (patch) =>
        goto(Url.set_params(params, patch), {
          // Keep the focused search box and the scroll position.
          reset: false,
        }),
    }}
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
    empty={({ filtering }) =>
      filtering
        ? {
            title: "No matching tasks",
            description: "Try a different search or clear the filters.",
          }
        : {
            title: "No tasks yet",
            description: "Create a task to get started.",
          }}
    href={(row) => resolve("/(authed)/tasks/[id]", row.original)}
    actions={(row) => [
      {
        title: "Edit task",
        icon: "lucide/pencil",
        href: resolve("/(authed)/tasks/[id]/edit", row.original),
      },

      {
        title: "Delete task",
        icon: "lucide/trash-2",
        variant: "destructive",
        onselect: () =>
          TaskClient.delete(row.original.id, { on_success: reload }),
      },
    ]}
  ></DataTable>
</article>
