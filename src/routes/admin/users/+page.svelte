<script lang="ts">
  import { AdminClient } from "$lib/clients/admin.client.js";
  import Time from "$lib/components/Time.svelte";
  import UserAvatar from "$lib/components/ui/avatar/UserAvatar.svelte";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import { renderComponent } from "$lib/components/ui/data-table/render-helpers.js";
  import SingleSelect from "$lib/components/ui/select/SingleSelect.svelte";
  import {
    ACCESS_CONTROL,
    type IAccessControl,
  } from "$lib/const/access_control.const";
  import { ROUTES } from "$lib/const/routes.const.js";
  import { TOAST } from "$lib/const/toast.const.js";
  import { App } from "$lib/utils/app.js";
  import { Items } from "$lib/utils/items.util.js";
  import { TanstackTable } from "$lib/utils/tanstack/table.util.js";

  let { data } = $props();
  let { users } = $state(data);

  const update_user_role = async (
    user_id: string,
    role: IAccessControl.RoleId,
  ) => {
    const res = await AdminClient.update_user_role(user_id, role);
    if (res.ok) {
      users = Items.patch(users, user_id, { role });
    }
  };

  const impersonate_user = async (user_id: string) => {
    const res = await AdminClient.impersonate_user(user_id);
    if (res.ok) {
      location.href = App.url(ROUTES.PROFILE, {
        toast: TOAST.IDS.ADMIN_IMPERSONATING_USER,
      });
    }
  };

  const delete_user = async (user_id: string) => {
    const res = await AdminClient.delete_user(user_id);
    if (res.ok) {
      users = Items.remove(users, user_id);
    }
  };
</script>

<DataTable
  data={users}
  columns={TanstackTable.make_columns<(typeof users)[number]>({
    columns: [
      {
        id: "avatar",
        enableHiding: false,
        enableSorting: false,

        cell: ({ row }) => renderComponent(UserAvatar, { user: row.original }),
      },
      {
        accessorKey: "name",
        meta: { label: "Name" },
      },
      {
        accessorKey: "email",
        meta: { label: "Email" },
      },
      {
        accessorKey: "role",
        meta: { label: "Role" },

        cell: ({ row }) =>
          renderComponent(SingleSelect, {
            value: row.original.role,
            options: ACCESS_CONTROL.ROLES.OPTIONS,
            on_value_select: (value) =>
              update_user_role(row.original.id, value as IAccessControl.RoleId),
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
        icon: "lucide/user-circle",
        title: "Impersonate user",
        onselect: (row) => impersonate_user(row.original.id),
      },
      {
        kind: "item",
        icon: "lucide/x",
        title: "Delete user",
        onselect: (row) => delete_user(row.original.id),
      },
    ],
  })}
></DataTable>
