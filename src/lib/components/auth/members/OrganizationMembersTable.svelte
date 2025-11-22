<script lang="ts">
  import type { auth } from "$lib/auth";
  import { MembersClient } from "$lib/clients/members.client";
  import Time from "$lib/components/Time.svelte";
  import UserAvatar from "$lib/components/ui/avatar/UserAvatar.svelte";
  import { renderComponent } from "$lib/components/ui/data-table";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
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
  columns={TanstackTable.make_columns<(typeof members)[number]>(
    ({ accessor, display }) => ({
      columns: [
        display({
          id: "avatar",
          enableHiding: false,
          enableSorting: false,

          cell: ({ row }) =>
            renderComponent(UserAvatar, { user: row.original.user }),
        }),

        accessor("user.name", {
          meta: { label: "Name" },
        }),

        accessor("user.email", {
          meta: { label: "Email" },
        }),
        accessor("role", {
          meta: { label: "Role" },

          cell: ({ getValue, row }) =>
            renderComponent(NativeSelect, {
              value: getValue(),
              options: ORGANIZATION.ROLES.OPTIONS,
              on_value_select: (value) =>
                update_member_role(row.original, value as IOrganization.RoleId),
            }),
        }),

        accessor("createdAt", {
          meta: { label: "Join date" },

          cell: ({ getValue }) => renderComponent(Time, { date: getValue() }),
        }),
      ],

      actions: [
        {
          kind: "item" as const,
          icon: "lucide/x",
          title: "Remove member",
          onselect: (row) => remove_member(row.original.id),
        },
      ],
    }),
  )}
></DataTable>
