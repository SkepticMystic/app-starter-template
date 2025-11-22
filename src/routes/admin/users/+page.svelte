<script lang="ts">
  import { AdminClient } from "$lib/clients/admin.client.js";
  import Time from "$lib/components/Time.svelte";
  import UserAvatar from "$lib/components/ui/avatar/UserAvatar.svelte";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import { renderComponent } from "$lib/components/ui/data-table/render-helpers.js";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import {
    ACCESS_CONTROL,
    type IAccessControl,
  } from "$lib/const/access_control.const";
  import { TOAST } from "$lib/const/toast.const.js";
  import { App } from "$lib/utils/app.js";
  import { Items } from "$lib/utils/items.util.js";
  import { TanstackTable } from "$lib/utils/tanstack/table.util.js";

  let { data } = $props();
  let users = $state(data.users);

  const update_user_role = async (
    input: Parameters<typeof AdminClient.update_user_role>[0],
  ) => {
    const res = await AdminClient.update_user_role(input);
    if (res.ok) {
      users = Items.patch(users, input.userId, { role: input.role });
    }
  };

  const impersonate_user = async (user_id: string) => {
    const res = await AdminClient.impersonate_user(user_id);
    if (res.ok) {
      location.href = App.url("/profile", {
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
  actions={(row) => [
    {
      icon: "lucide/user-circle",
      title: "Impersonate user",
      onselect: () => impersonate_user(row.id),
    },
    { kind: "separator" },
    {
      title: row.original.banned ? "Unban user" : "Ban user",
      icon: row.original.banned ? "lucide/check-circle-2" : "lucide/ban",
      onselect: () =>
        row.original.banned
          ? AdminClient.unban_user(row.id)
          : AdminClient.ban_user(row.id, {}),
    },
    {
      icon: "lucide/x",
      title: "Delete user",
      onselect: () => delete_user(row.id),
    },
  ]}
  columns={TanstackTable.make_columns<(typeof users)[number]>(
    ({ accessor, display }) => [
      display({
        id: "avatar",
        enableHiding: false,
        enableSorting: false,

        cell: ({ row }) => renderComponent(UserAvatar, { user: row.original }),
      }),
      accessor("name", {
        meta: { label: "Name" },
      }),
      accessor("email", {
        meta: { label: "Email" },
      }),
      accessor("role", {
        meta: { label: "Role" },

        cell: ({ row, getValue }) =>
          renderComponent(NativeSelect, {
            value: getValue(),
            options: ACCESS_CONTROL.ROLES.OPTIONS,
            on_value_select: (value) =>
              update_user_role({
                userId: row.id,
                role: value as IAccessControl.RoleId,
              }),
          }),
      }),

      accessor("createdAt", {
        meta: { label: "Join date" },

        cell: ({ getValue }) => renderComponent(Time, { date: getValue() }),
      }),
    ],
  )}
></DataTable>
