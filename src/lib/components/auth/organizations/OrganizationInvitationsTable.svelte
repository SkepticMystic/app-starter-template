<script lang="ts">
  import { OrganizationsClient } from "$lib/clients/organizations.client";
  import Time from "$lib/components/Time.svelte";
  import { renderComponent } from "$lib/components/ui/data-table";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import Labeled from "$lib/components/ui/label/Labeled.svelte";
  import MultiSelect from "$lib/components/ui/select/MultiSelect.svelte";
  import {
    type IOrganization,
    ORGANIZATION,
  } from "$lib/const/organization.const";
  import { Items } from "$lib/utils/items.util";
  import { TanstackTable } from "$lib/utils/tanstack/table.util";
  import type { Invitation } from "better-auth/plugins";

  let {
    on_delete,
    invitations,
  }: {
    invitations: Invitation[];
    on_delete?: (invitation: Invitation) => void;
  } = $props();
</script>

<DataTable
  data={invitations}
  states={{
    sorting: [{ id: "expiresAt", desc: true }],
    column_filters: [{ id: "status", value: ["pending"] }],
  }}
  actions={(row) => [
    {
      icon: "lucide/x",
      title: "Cancel invitation",

      disabled: row.original.status !== "pending",

      onselect: async () => {
        const res = await OrganizationsClient.cancel_invitation(row.id);

        if (res.ok) {
          invitations = Items.patch(invitations, row.id, res.data);
          on_delete?.(res.data);
        }
      },
    },
  ]}
  columns={TanstackTable.make_columns<Invitation>(({ accessor }) => [
    accessor("email", {
      meta: { label: "Email" },
    }),
    accessor("role", {
      meta: { label: "Role" },

      cell: ({ getValue }) =>
        ORGANIZATION.ROLES.MAP[getValue() as IOrganization.RoleId].label,
    }),

    accessor("status", {
      meta: { label: "Status" },

      filterFn: "arrIncludesSome",

      cell: ({ getValue }) =>
        ORGANIZATION.INVITATIONS.STATUSES.MAP[getValue()].label,
    }),

    accessor("expiresAt", {
      meta: { label: "Expiry date" },

      cell: ({ getValue }) =>
        renderComponent(Time, { show: "datetime", date: getValue() }),
    }),
  ])}
>
  {#snippet header(table)}
    <Labeled label="Statuses">
      <MultiSelect
        options={ORGANIZATION.INVITATIONS.STATUSES.OPTIONS}
        bind:value={
          () => (table.getColumn("status")?.getFilterValue() as string[]) ?? [],
          (v) => table.getColumn("status")?.setFilterValue(v)
        }
      />
    </Labeled>
  {/snippet}
</DataTable>
