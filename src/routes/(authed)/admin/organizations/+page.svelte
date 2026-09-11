<script lang="ts">
  import { OrganizationClient } from "$lib/clients/auth/organization.client.js";
  import { CellHelpers, column_helper } from "$lib/utils/tanstack/table.util";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import { Arrays } from "$lib/utils/array/array.util.js";
  import { Format } from "$lib/utils/format.util.js";

  let { data } = $props();
  let orgs = $derived(data.orgs);

  const column = column_helper<(typeof orgs)[number]>();

  const columns = [
    column.accessor("name", {
      meta: { label: "Name" },

      footer: ({ table }) =>
        Format.number(table.getPrePaginatedRowModel().flatRows.length) +
        " organizations",
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

  const actions = {
    delete: (org_id: string) =>
      OrganizationClient.admin_delete(org_id, {
        on_success: () => (orgs = Arrays.remove(orgs, org_id)),
      }),
  };
</script>

<article>
  <header>
    <h1>Organizations</h1>
  </header>

  <DataTable
    {columns}
    noun="organization"
    data={orgs}
    filters={[
      {
        kind: "search",
        id: "name",
        label: "Name",
        placeholder: "Search by name",
      },
    ]}
    actions={(row) => [
      {
        icon: "lucide/x",
        title: "Delete org",
        variant: "destructive",
        onselect: () => actions.delete(row.id),
      },
    ]}
  ></DataTable>
</article>
