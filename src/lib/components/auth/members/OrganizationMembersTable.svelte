<script lang="ts">
  import type { auth } from "$lib/auth";
  import { MembersClient } from "$lib/clients/members.client";
  import Time from "$lib/components/Time.svelte";
  import UserAvatar from "$lib/components/ui/avatar/UserAvatar.svelte";
  import { renderComponent } from "$lib/components/ui/data-table";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import Select from "$lib/components/ui/select/SingleSelect.svelte";
  import {
    ORGANIZATION,
    type IOrganization,
  } from "$lib/const/organization.const";
  import { Items } from "$lib/utils/items.util";
  import { TanstackTable } from "$lib/utils/tanstack/table.util";

  let {
    members = $bindable(),
  }: {
    members: Awaited<ReturnType<typeof auth.api.listMembers>>["members"];
  } = $props();

  const update_member_role = async (
    member: (typeof members)[number],
    role_id: IOrganization.RoleId,
  ) => {
    if (!role_id || role_id === member.role) {
      return;
    }

    const res = await MembersClient.update_member_role(member.id, role_id);
    if (res.ok) {
      members = Items.patch(members, member.id, { role: role_id });
    }
  };

  const remove_member = async (member_id: string) => {
    const res = await MembersClient.remove_member(member_id);
    if (res.ok) {
      members = Items.remove(members, member_id);
    }
  };
</script>

<DataTable
  data={members}
  columns={TanstackTable.make_columns<(typeof members)[number]>({
    columns: [
      {
        id: "avatar",
        enableHiding: false,
        enableSorting: false,

        cell: ({ row }) =>
          renderComponent(UserAvatar, { user: row.original.user }),
      },
      {
        accessorKey: "user.name",
        meta: { label: "Name" },
      },
      {
        accessorKey: "user.email",
        meta: { label: "Email" },
      },
      {
        accessorKey: "role",
        meta: { label: "Role" },

        cell: ({ row }) =>
          renderComponent(Select, {
            value: row.original.role,
            options: ORGANIZATION.ROLES.OPTIONS,
            on_value_select: (value) =>
              update_member_role(row.original, value as IOrganization.RoleId),
          }),
      },

      {
        accessorKey: "createdAt",
        meta: { label: "Join date" },

        cell: ({ row }) =>
          renderComponent(Time, { date: row.original.createdAt }),
      },
    ],

    actions: [
      {
        kind: "item",
        icon: "lucide/x",
        title: "Remove member",
        onselect: (row) => remove_member(row.original.id),
      },
    ],
  })}
></DataTable>
