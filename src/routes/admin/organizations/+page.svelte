<script lang="ts">
  import { OrganizationClient } from "$lib/clients/auth/organization.client.js";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { Format } from "$lib/utils/format.util.js";
  import { Items } from "$lib/utils/items.util.js";
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

  const actions = {
    delete: async (org_id: string) => {
      const res = await OrganizationClient.admin_delete(org_id);

      if (res.ok) {
        orgs = Items.remove(orgs, org_id);
      }
    },
  };
</script>

<article>
  <header>
    <h1>Organizations</h1>
  </header>

  <DataTable
    {columns}
    data={orgs}
    actions={(row) => [
      {
        icon: "lucide/x",
        title: "Delete org",
        variant: "destructive",
        onselect: () => actions.delete(row.id),
      },
    ]}
  >
    {#snippet header(table)}
      <search class="flex flex-wrap gap-2">
        <Field label="Name">
          {#snippet input({ props })}
            <Input
              {...props}
              placeholder="Search by name"
              bind:value={
                () => table.getColumn("name")?.getFilterValue(),
                (v) => table.getColumn("name")?.setFilterValue(v)
              }
            />
          {/snippet}
        </Field>
      </search>
    {/snippet}
  </DataTable>
</article>
