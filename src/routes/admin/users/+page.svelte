<script lang="ts">
  import { AdminClient } from "$lib/clients/auth/admin.client.js";
  import UserAvatar from "$lib/components/ui/avatar/UserAvatar.svelte";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import { renderComponent } from "$lib/components/ui/data-table/render-helpers.js";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import { ROLES, type RoleId } from "$lib/const/auth/role.const.js";
  import { Items } from "$lib/utils/items.util.js";
  import { CellHelpers } from "$lib/utils/tanstack/table.util.js";
  import { createColumnHelper } from "@tanstack/table-core";

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

  const delete_user = async (user_id: string) => {
    const res = await AdminClient.delete_user(user_id);
    if (res.ok) {
      users = Items.remove(users, user_id);
    }
  };

  const ban_user = async (userId: string) => {
    const res = await AdminClient.ban_user({ userId });
    if (res.ok) {
      users = Items.patch(users, userId, res.data.user);
    }
  };

  const unban_user = async (user_id: string) => {
    const res = await AdminClient.unban_user(user_id);
    if (res.ok) {
      users = Items.patch(users, user_id, res.data.user);
    }
  };

  const column = createColumnHelper<(typeof users)[number]>();

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

      cell: ({ row, getValue }) =>
        renderComponent(NativeSelect<RoleId>, {
          value: getValue(),
          options: ROLES.OPTIONS,
          on_value_select: (role) => update_user_role({ role, userId: row.id }),
        }),
    }),

    column.accessor("banned", {
      meta: { label: "Banned" },

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
    data={users}
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

        <Field label="Email">
          {#snippet input({ props })}
            <Input
              {...props}
              placeholder="Search by email"
              bind:value={
                () => table.getColumn("email")?.getFilterValue(),
                (v) => table.getColumn("email")?.setFilterValue(v)
              }
            />
          {/snippet}
        </Field>

        <Field label="Role">
          {#snippet input({ props })}
            <NativeSelect
              {...props}
              options={[{ value: undefined, label: "All" }, ...ROLES.OPTIONS]}
              bind:value={
                () => table.getColumn("role")?.getFilterValue(),
                (v) => table.getColumn("role")?.setFilterValue(v)
              }
            />
          {/snippet}
        </Field>

        <Field label="Banned">
          {#snippet input({ props })}
            <NativeSelect
              {...props}
              options={[
                { value: undefined, label: "All" },
                { value: true, label: "Yes" },
                { value: false, label: "No" },
              ]}
              bind:value={
                () => table.getColumn("banned")?.getFilterValue(),
                (v) => table.getColumn("banned")?.setFilterValue(v)
              }
            />
          {/snippet}
        </Field>
      </search>
    {/snippet}
  </DataTable>
</article>
