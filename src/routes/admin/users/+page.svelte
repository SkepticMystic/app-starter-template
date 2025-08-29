<script lang="ts">
  import { AdminClient } from "$lib/clients/admin.client.js";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
  import Table from "$lib/components/Table.svelte";
  import Time from "$lib/components/Time.svelte";
  import {
    ACCESS_CONTROL,
    type IAccessControl,
  } from "$lib/const/access_control.const";
  import { ROUTES } from "$lib/const/routes.const.js";
  import { TOAST } from "$lib/const/toast.const.js";
  import { App } from "$lib/utils/app.js";
  import { Format } from "$lib/utils/format.util";
  import { Items } from "$lib/utils/items.util.js";
  import { Loader } from "$lib/utils/loader";
  import { Strings } from "$lib/utils/strings.util";

  let { data } = $props();
  let { users } = $state(data);

  const loader = Loader<
    | `update_user_role:${string}`
    | `impersonate_user:${string}`
    | `delete_user:${string}`
  >();

  const update_user_role = async (
    user_id: string,
    role_id: IAccessControl.RoleId,
  ) => {
    loader.load(`update_user_role:${user_id}`);

    const res = await AdminClient.update_user_role(user_id, role_id);
    if (res.ok) {
      users = Items.patch(users, user_id, { role: role_id });
    }

    loader.reset();

    return res;
  };

  const impersonate_user = async (user_id: string) => {
    loader.load(`impersonate_user:${user_id}`);

    const res = await AdminClient.impersonate_user(user_id);
    if (res.ok) {
      location.href = App.url(ROUTES.PROFILE, {
        toast: TOAST.IDS.ADMIN_IMPERSONATING_USER,
      });
    }

    loader.reset();

    return res;
  };

  const delete_user = async (user_id: string) => {
    loader.load(`delete_user:${user_id}`);

    const res = await AdminClient.delete_user(user_id);
    if (res.ok) {
      users = Items.remove(users, user_id);
    }

    loader.reset();
  };

  let rows = $derived(users);
</script>

<Table data={rows}>
  {#snippet header()}
    <th> Name </th>
    <th> Role </th>
    <th> Join date </th>
    <th> Actions </th>
  {/snippet}

  {#snippet row(user)}
    <tr>
      <td>
        <div class="flex flex-col">
          {#if user.name}
            <span>{user.name}</span>
          {/if}
          <span>{user.email}</span>
        </div>
      </td>

      <td>
        <select
          class="select"
          value={user.role}
          disabled={$loader[`update_user_role:${user.id}`]}
          onchange={async (e) => {
            const res = await update_user_role(
              user.id,
              e.currentTarget.value as IAccessControl.RoleId,
            );
            if (!res.ok) {
              // Revert selection on error
              e.currentTarget.value = user.role;
            }
          }}
        >
          {#each ACCESS_CONTROL.ROLES.IDS as role_id (role_id)}
            <option value={role_id}>
              {ACCESS_CONTROL.ROLES.MAP[role_id].name}
            </option>
          {/each}
        </select>
      </td>

      <td>
        <Time date={user.createdAt} />
      </td>

      <td>
        <div class="flex gap-1">
          <button
            title="Impersonate user"
            class="btn btn-square btn-info"
            onclick={() => impersonate_user(user.id)}
            disabled={$loader[`impersonate_user:${user.id}`]}
          >
            <Loading loading={$loader[`impersonate_user:${user.id}`]}>
              <Icon icon="heroicons/user-circle" />
            </Loading>
          </button>

          <button
            title="Remove user"
            class="btn btn-square btn-warning"
            onclick={() => delete_user(user.id)}
            disabled={$loader[`delete_user:${user.id}`]}
          >
            <Loading loading={$loader[`delete_user:${user.id}`]}>
              <Icon icon="heroicons/user-minus" />
            </Loading>
          </button>
        </div>
      </td>
    </tr>
  {/snippet}

  {#snippet footer()}
    <td colspan="4">
      {Format.number(rows.length)}
      {Strings.pluralize("user", rows.length)}
    </td>
  {/snippet}
</Table>
