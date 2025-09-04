<script lang="ts">
  import { OrganizationsClient } from "$lib/clients/organizations.client";
  import Time from "$lib/components/Time.svelte";
  import { renderComponent } from "$lib/components/ui/data-table";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import { ORGANIZATION } from "$lib/const/organization.const";
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
    column_filters: [{ id: "status", value: ["pending"] }],
  }}
  columns={TanstackTable.make_columns<Invitation>({
    columns: [
      {
        accessorKey: "email",
        meta: { label: "Email" },
      },
      {
        accessorKey: "role",
        meta: { label: "Role" },

        cell: ({ row }) =>
          ORGANIZATION.INVITATIONS.STATUSES.MAP[row.original.status].label,
      },
      {
        accessorKey: "status",
        meta: { label: "Status" },

        cell: ({ row }) =>
          ORGANIZATION.INVITATIONS.STATUSES.MAP[row.original.status].label,
      },

      {
        accessorKey: "expiresAt",
        meta: { label: "Expiry date" },

        cell: ({ row }) =>
          renderComponent(Time, {
            show: "datetime",
            date: row.original.expiresAt,
          }),
      },
    ],

    actions: [
      {
        kind: "item",
        icon: "lucide/x",
        title: "Cancel invitation",

        disabled: (row) => row.original.status !== "pending",

        onselect: async (row) => {
          const res = await OrganizationsClient.cancel_invitation(
            row.original.id,
          );

          if (res.ok) {
            invitations = Items.patch(invitations, row.original.id, res.data);
            on_delete?.(res.data);
          }
        },
      },
    ],
  })}
></DataTable>
