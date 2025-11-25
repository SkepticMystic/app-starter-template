<script lang="ts">
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import { Format } from "$lib/utils/format.util.js";
  import { CellHelpers } from "$lib/utils/tanstack/table.util.js";
  import { createColumnHelper } from "@tanstack/table-core";

  let { data } = $props();
  let orgs = $state(data.orgs);

  const column = createColumnHelper<(typeof orgs)[number]>();

  const columns = [
    column.accessor("name", {
      meta: { label: "Name" },

      footer: ({ table }) =>
        Format.number(table.getRowModel().flatRows.length) + " organizations",
    }),

    column.accessor("members", {
      meta: { label: "Members" },

      cell: ({ getValue }) => Format.number(getValue().length),
    }),

    column.accessor("createdAt", {
      meta: { label: "Join date" },

      cell: CellHelpers.time,
    }),
  ];
</script>

<article>
  <header>
    <h1>Organizations</h1>
  </header>

  <DataTable
    {columns}
    data={orgs}
    actions={(_row) => [
      // {
      //   icon: "lucide/x",
      //   title: "Delete org",
      //   variant: "destructive",
      //   onselect: () => delete_org(row.id),
      // },
    ]}
  ></DataTable>
</article>
