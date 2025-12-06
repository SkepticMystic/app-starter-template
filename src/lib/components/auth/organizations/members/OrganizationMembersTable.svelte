<script lang="ts">
  import { OrganizationClient } from "$lib/clients/auth/organization.client";
  import UserAvatar from "$lib/components/ui/avatar/UserAvatar.svelte";
  import { renderComponent } from "$lib/components/ui/data-table";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import Time from "$lib/components/ui/elements/Time.svelte";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import {
    ORGANIZATION,
    type IOrganization,
  } from "$lib/const/auth/organization.const";
  import { get_all_members_remote } from "$lib/remote/auth/organization/member.remote";
  import { createColumnHelper } from "@tanstack/table-core";

  const members = get_all_members_remote();

  type TData = NonNullable<typeof members.current>[number];

  const update_member_role = async (
    member: TData,
    role_id: IOrganization.RoleId,
  ) => {
    if (!role_id || role_id === member.role) {
      return;
    }

    return await OrganizationClient.member.update_role({
      role: role_id,
      memberId: member.id,
    });
  };

  const column = createColumnHelper<TData>();

  const columns = [
    column.display({
      id: "avatar",
      enableHiding: false,
      enableSorting: false,

      cell: ({ row }) =>
        renderComponent(UserAvatar, { user: row.original.user }),
    }),

    column.accessor("user.name", {
      meta: { label: "Name" },
    }),

    column.accessor("user.email", {
      meta: { label: "Email" },
    }),
    column.accessor("role", {
      meta: { label: "Role" },

      cell: ({ getValue, row }) =>
        renderComponent(NativeSelect<IOrganization.RoleId>, {
          value: getValue(),
          options: ORGANIZATION.ROLES.OPTIONS,
          on_value_select: (value) => update_member_role(row.original, value),
        }),
    }),

    column.accessor("createdAt", {
      meta: { label: "Join date" },

      cell: ({ getValue }) => renderComponent(Time, { date: getValue() }),
    }),
  ];
</script>

<DataTable
  {columns}
  loading={members.loading}
  data={members.current ?? []}
  actions={(row) => [
    {
      icon: "lucide/x",
      title: "Remove member",
      variant: "destructive",
      onselect: () => OrganizationClient.member.remove(row.id),
    },
  ]}
></DataTable>
