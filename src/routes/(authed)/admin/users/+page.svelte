<script lang="ts">
  import { AdminClient } from "$lib/clients/auth/admin.client.js";
  import { CellHelpers, column_helper } from "$lib/utils/tanstack/table.util";
  import UserAvatar from "$lib/components/ui/avatar/UserAvatar.svelte";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import { renderComponent } from "$lib/components/ui/data-table";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import { ROLES, type RoleId } from "$lib/const/auth/role.const.js";
  import { Arrays } from "$lib/utils/array/array.util.js";

  let { data } = $props();
  let users = $derived(data.users);

  const update_user_role = (
    input: Parameters<typeof AdminClient.update_user_role>[0],
  ) =>
    AdminClient.update_user_role(input, {
      on_success: () =>
        (users = Arrays.patch(users, input.userId, { role: input.role })),
    });

  const delete_user = (user_id: string) =>
    AdminClient.delete_user(user_id, {
      on_success: () => (users = Arrays.remove(users, user_id)),
    });

  const ban_user = (userId: string) =>
    AdminClient.ban_user(
      { userId },
      {
        on_success: (d) =>
          (users = Arrays.patch(users, userId, {
            banReason: d.user.banReason,
            banExpires: d.user.banExpires,
            banned: d.user.banned ?? false,
          })),
      },
    );

  const unban_user = (user_id: string) =>
    AdminClient.unban_user(user_id, {
      on_success: (d) =>
        (users = Arrays.patch(users, user_id, {
          banReason: d.user.banReason,
          banExpires: d.user.banExpires,
          banned: d.user.banned ?? false,
        })),
    });

  const column = column_helper<(typeof users)[number]>();

  const columns = [
    column.display({
      id: "avatar",
      enableHiding: false,
      enableSorting: false,

      cell: ({ row }) => renderComponent(UserAvatar, { user: row.original }),
    }),

    column.accessor("name", {
      meta: { label: "Name" },
    }),

    column.accessor("email", {
      meta: { label: "Email" },
    }),

    column.accessor("role", {
      meta: { label: "Role" },

      // Named, not "auto": auto resolves a string column to `includesString`,
      // so filtering to `admin` would also match `superadmin`.
      filterFn: "equals",

      cell: ({ row, getValue }) =>
        renderComponent(NativeSelect<RoleId>, {
          value: getValue(),
          options: ROLES.OPTIONS,
          on_value_select: (role) => update_user_role({ role, userId: row.id }),
        }),
    }),

    column.accessor("banned", {
      meta: { label: "Banned" },

      // Named so the choice survives the column gaining a null: "auto" picks
      // the fn from the first non-null row value, and would fall to
      // `weakEquals` if it found none. `equals` keeps a `false` filter, since
      // `autoRemove` only drops undefined/null/"".
      filterFn: "equals",

      cell: ({ getValue }) => (getValue() ? "Yes" : "No"),
    }),

    column.accessor("createdAt", {
      meta: { label: "Join date" },

      cell: CellHelpers.time,
    }),
  ];
</script>

<article>
  <header>
    <h1>Users</h1>
  </header>

  <DataTable
    {columns}
    noun="user"
    data={users}
    filters={[
      {
        kind: "search",
        id: "name",
        label: "Name",
        placeholder: "Search by name",
      },
      {
        kind: "search",
        id: "email",
        label: "Email",
        placeholder: "Search by email",
      },
      { kind: "select", id: "role", label: "Role", options: ROLES.OPTIONS },
      {
        kind: "select",
        id: "banned",
        label: "Banned",
        options: [
          { value: true, label: "Yes" },
          { value: false, label: "No" },
        ],
      },
    ]}
    actions={(row) => [
      {
        icon: "lucide/user-circle",
        title: "Impersonate user",
        onselect: () => AdminClient.impersonate_user(row.id),
      },
      { kind: "separator" },
      {
        title: row.original.banned ? "Unban user" : "Ban user",
        icon: row.original.banned ? "lucide/check-circle-2" : "lucide/ban",
        onselect: () =>
          row.original.banned ? unban_user(row.id) : ban_user(row.id),
      },
      {
        icon: "lucide/x",
        title: "Delete user",
        variant: "destructive",
        onselect: () => delete_user(row.id),
      },
    ]}
  ></DataTable>
</article>
