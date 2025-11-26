<script lang="ts">
  import { OrganizationClient } from "$lib/clients/auth/organization.client";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import MultiSelect from "$lib/components/ui/select/MultiSelect.svelte";
  import { ORGANIZATION } from "$lib/const/auth/organization.const";
  import { get_all_invitations_remote } from "$lib/remote/auth/organization/invitation.remote";
  import { CellHelpers } from "$lib/utils/tanstack/table.util";
  import { createColumnHelper } from "@tanstack/table-core";

  const invitations = get_all_invitations_remote();

  const column =
    createColumnHelper<NonNullable<typeof invitations.current>[number]>();

  const columns = [
    column.accessor("email", {
      meta: { label: "Email" },
    }),
    column.accessor("role", {
      meta: { label: "Role" },

      cell: (c) => CellHelpers.label(c, ORGANIZATION.ROLES.MAP),
    }),

    column.accessor("status", {
      meta: { label: "Status" },

      filterFn: "arrIncludesSome",

      cell: (c) => CellHelpers.label(c, ORGANIZATION.INVITATIONS.STATUSES.MAP),
    }),

    column.accessor("expiresAt", {
      meta: { label: "Expiry date" },

      cell: (c) => CellHelpers.time(c, { show: "datetime" }),
    }),
  ];
</script>

<DataTable
  {columns}
  loading={invitations.loading}
  data={invitations.current ?? []}
  states={{
    sorting: [{ id: "expiresAt", desc: true }],
    column_filters: [{ id: "status", value: ["pending"] }],
  }}
  empty={{
    icon: "lucide/mail",
    title: "No invitations",
    description: "Invite a new member to your organization",
  }}
  actions={(row) => [
    {
      icon: "lucide/x",
      variant: "destructive",
      title: "Cancel invitation",
      disabled: row.original.status !== "pending",

      onselect: () => OrganizationClient.invitation.cancel(row.id),
    },
  ]}
>
  {#snippet header(table)}
    <Field label="Statuses">
      {#snippet input({ props })}
        <MultiSelect
          {...props}
          options={ORGANIZATION.INVITATIONS.STATUSES.OPTIONS}
          bind:value={
            () =>
              (table.getColumn("status")?.getFilterValue() as string[]) ?? [],
            (v) => table.getColumn("status")?.setFilterValue(v)
          }
        />
      {/snippet}
    </Field>
  {/snippet}
</DataTable>
